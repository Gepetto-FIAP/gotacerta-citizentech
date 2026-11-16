/*
  GOTA CERTA · Dispositivo do hidrômetro (FIAP GS 2026/2 · Parte 6 · Luiz)

  SENSOR 1 · Leitor óptico (LED infravermelho + fototransistor): mede a ÁGUA.
     O LED ilumina o ponteiro de litros e o fototransistor mede a luz que volta.
     fundo branco  -> volta muita luz (0,82)
     ponteiro      -> volta pouca luz (0,18)
     Cada vez que o ponteiro passa embaixo do sensor = 1 volta = 1 litro.

  SENSOR 2 · LDR (luz externa): protege o MEDIDOR.
     O dispositivo fica numa caixa fechada e escura. Se entrar luz (mais de 50 lux),
     alguém abriu ou está mexendo na tampa: possível fraude ou vandalismo.

  No Wokwi:
     REGISTRO (potenciômetro) = abre a torneira (0 a 60 L/min)
     DESCARGA (botão)         = liga/desliga uma descarga pingando (0,33 L/min)
     Slider do LDR            = luz que entra na caixa (suba para "abrir a tampa")

  A cada 5 segundos reais (= 10 minutos simulados) o ESP32 publica a leitura
  no HiveMQ. O Node-RED pega e entrega para a API, que decide os alertas.
*/

#include <WiFi.h>
#include <PubSubClient.h>

// ================= 1. CONFIGURAÇÃO =================

// Qual casa do banco de teste este ESP32 representa:
//   1 = Dona Maria (GC-001): DESCARGA = vazamento | REGISTRO aberto = cano rompido
//   4 = Sr. João   (GC-004): REGISTRO aberto por ~45 s = meta do mês estourada
#define CASA 1

#if CASA == 4
const char* CODIGO_DISPOSITIVO = "GC-004";
double      LEITURA_INSTALACAO = 314200;    // número do mostrador no dia da instalação (litros)
int         HORA_INICIAL       = 8;         // começa às 08:00
#else
const char* CODIGO_DISPOSITIVO = "GC-001";
double      LEITURA_INSTALACAO = 1234582;
int         HORA_INICIAL       = 2;         // começa às 02:00 (madrugada)
#endif

const char* WIFI_NOME   = "Wokwi-GUEST";
const char* MQTT_BROKER = "broker.hivemq.com";
const char* MQTT_TOPICO = "fiap/3esoa/gotacerta/leituras";

const int SEGUNDOS_ENTRE_ENVIOS = 5;    // tempo real entre um envio e outro
const int MINUTOS_POR_ENVIO     = 10;   // quanto tempo simulado cada envio representa

const int PINO_LED_IR    = 26;   // Sensor 1
const int PINO_LED_PULSO = 27;   // aceso quando o ponteiro está girando
const int PINO_REGISTRO  = 34;   // potenciômetro
const int PINO_LDR       = 35;   // Sensor 2
const double LUX_TAMPA_ABERTA = 50;   // acima disso, a tampa foi aberta
const int PINO_DESCARGA  = 14;   // botão

// ================= 2. OS SENSORES =================

double litrosQuePassaram = LEITURA_INSTALACAO;  // o hidrômetro "de verdade"
long   pulsosTotal = 0;                          // litros que o sensor contou
bool   vendoPonteiro = false;
double luzDeFora = 0;     // quanto a luz externa atrapalha o Sensor 1 (0 a 0,15)
double luxExterno = 0;    // o que o Sensor 2 mediu
bool   tampaAberta = false;

// SENSOR 1: o LED acende e o fototransistor lê quanta luz voltou.
double lerFototransistor() {
  double angulo = fmod(litrosQuePassaram, 1.0) * 360.0;   // posição do ponteiro (0 a 360°)
  bool ponteiroEmbaixo = fabs(angulo - 180.0) <= 10.0;     // sensor fica sobre a marca "5"
  double luz = ponteiroEmbaixo ? 0.18 : 0.82;
  luz += luzDeFora + random(-3, 4) / 100.0;                // ruído
  return constrain(luz, 0.0, 1.0);
}

// Histerese: conta quando a luz cai abaixo de 0,40 e só rearma acima de 0,60.
// Assim o ruído não faz a mesma passagem do ponteiro contar duas vezes.
bool contouPulso(double luz) {
  if (!vendoPonteiro && luz < 0.40) { vendoPonteiro = true; return true; }
  if (vendoPonteiro && luz > 0.60) vendoPonteiro = false;
  return false;
}

// ================= 3. SIMULAR A ÁGUA =================

int    hora, minuto, dia = 15;      // relógio simulado (15/11/2026)
long   pulsosDoEnvio;
long   piscadasDoLed;
double luzMinima;
bool   descargaLigada = false;

void passarAgua(double vazaoLpm) {
  double litros = vazaoLpm * MINUTOS_POR_ENVIO;
  // Amostragem adaptativa: 36 leituras por volta do ponteiro,
  // mas pelo menos 1 por minuto quando a água está parada (economiza bateria).
  long amostras = max((long)MINUTOS_POR_ENVIO, (long)ceil(litros * 36));
  pulsosDoEnvio = 0; luzMinima = 1.0; piscadasDoLed = amostras;

  digitalWrite(PINO_LED_IR, HIGH);
  for (long i = 0; i < amostras; i++) {
    litrosQuePassaram += litros / amostras;
    double luz = lerFototransistor();
    if (luz < luzMinima) luzMinima = luz;
    if (contouPulso(luz)) pulsosDoEnvio++;
  }
  pulsosTotal += pulsosDoEnvio;
  delay(50);
  digitalWrite(PINO_LED_IR, LOW);
  digitalWrite(PINO_LED_PULSO, pulsosDoEnvio > 0 ? HIGH : LOW);
}

// SENSOR 2: o LDR mede a luz dentro da caixa (em lux).
// No módulo do Wokwi, mais luz = número menor no pino. A conta abaixo
// é a fórmula da documentação do Wokwi para transformar o número em lux.
void lerSensorTampa() {
  double r = analogRead(PINO_LDR) / 4095.0;
  r = constrain(r, 0.001, 0.999);
  double resistencia = 10000.0 * r / (1.0 - r);
  luxExterno = pow(50000.0 * pow(10, 0.7) / resistencia, 1.0 / 0.7);

  bool abertaAgora = luxExterno > LUX_TAMPA_ABERTA;
  if (abertaAgora && !tampaAberta) Serial.printf("\n>> ALERTA: TAMPA ABERTA (%.0f lux)\n", luxExterno);
  if (!abertaAgora && tampaAberta) Serial.println("\n>> Tampa fechada de novo");
  tampaAberta = abertaAgora;

  // A luz que entra também atrapalha o Sensor 1 (até 0,15 a mais na leitura)
  luzDeFora = 0.15 * constrain(luxExterno / 1000.0, 0.0, 1.0);
}

double lerRegistro() {                       // 0 a 60 L/min
  double x = analogRead(PINO_REGISTRO) / 4095.0;
  return x < 0.02 ? 0 : round(60.0 * x);
}

void avancarRelogio() {
  minuto += MINUTOS_POR_ENVIO;
  if (minuto >= 60) { minuto -= 60; hora++; }
  if (hora >= 24)   { hora = 0; dia++; }
}

// ================= 4. ENVIAR (MQTT) =================

WiFiClient wifi;
PubSubClient mqtt(wifi);
char fila[10][320];      // leituras guardadas se a conexão cair
int  tamanhoFila = 0;
unsigned long ultimaTentativa = 0;

void conectarMqtt() {
  if (mqtt.connected() || millis() - ultimaTentativa < 3000) return;
  ultimaTentativa = millis();
  char id[24];
  snprintf(id, sizeof(id), "gotacerta-%ld", random(100000));
  Serial.print("Conectando ao HiveMQ... ");
  if (mqtt.connect(id)) Serial.println("conectado!");
  else Serial.printf("falhou (erro %d), tento de novo em 3 s\n", mqtt.state());
}

void enviarFila() {
  while (tamanhoFila > 0 && mqtt.connected()) {
    if (!mqtt.publish(MQTT_TOPICO, fila[0])) break;
    Serial.println("   ENVIADO para o HiveMQ");
    for (int i = 1; i < tamanhoFila; i++) strcpy(fila[i - 1], fila[i]);
    tamanhoFila--;
  }
  if (tamanhoFila > 0) Serial.printf("   sem conexão: %d leitura(s) esperando na fila\n", tamanhoFila);
}

void montarLeitura() {
  double vazaoMedia = (double)pulsosDoEnvio / MINUTOS_POR_ENVIO;
  double mostrador = LEITURA_INSTALACAO + pulsosTotal;   // 1 pulso = 1 litro

  if (tamanhoFila == 10) { tamanhoFila--; for (int i = 0; i < 9; i++) strcpy(fila[i], fila[i + 1]); }
  snprintf(fila[tamanhoFila], 320,
    "{\"codigoDispositivo\":\"%s\",\"dataHora\":\"2026-11-%02dT%02d:%02d:00\","
    "\"pulsosRegistrados\":%ld,\"vazaoInstantaneaLpm\":%.2f,"
    "\"leituraAcumuladaLitros\":%.1f,\"intensidadeLuz\":%.2f,"
    "\"luzExternaLux\":%.0f,\"tampaAberta\":%s}",
    CODIGO_DISPOSITIVO, dia, hora, minuto, pulsosDoEnvio, vazaoMedia, mostrador, luzMinima,
    luxExterno, tampaAberta ? "true" : "false");
  tamanhoFila++;

  Serial.printf("\n[%02d:%02d] SENSOR 1: pulsos %ld | vazão %.2f L/min | mostrador %.0f L | luz mín %.2f | LED piscou %ldx\n",
                hora, minuto, pulsosDoEnvio, vazaoMedia, mostrador, luzMinima, piscadasDoLed);
  Serial.printf("        SENSOR 2: %.0f lux | tampa %s\n", luxExterno, tampaAberta ? "ABERTA" : "fechada");
}

// ================= 5. ARDUINO =================

unsigned long ultimoEnvio = 0;
bool botaoAntes = HIGH;

void setup() {
  Serial.begin(115200);
  pinMode(PINO_LED_IR, OUTPUT);
  pinMode(PINO_LED_PULSO, OUTPUT);
  pinMode(PINO_DESCARGA, INPUT_PULLUP);

  Serial.printf("\n=== GOTA CERTA · %s ===\n", CODIGO_DISPOSITIVO);
  Serial.print("Conectando ao Wi-Fi");
  WiFi.begin(WIFI_NOME, "");
  while (WiFi.status() != WL_CONNECTED) { delay(250); Serial.print("."); }
  Serial.println(" conectado!");

  mqtt.setServer(MQTT_BROKER, 1883);
  mqtt.setBufferSize(512);
  mqtt.setKeepAlive(60);      // o Wokwi pode rodar mais devagar que o real: evita o HiveMQ derrubar
  conectarMqtt();

  hora = HORA_INICIAL; minuto = 0;
  lerSensorTampa();
  vendoPonteiro = lerFototransistor() < 0.40;   // calibração na instalação: não conta pulso
  Serial.printf("Relógio simulado: %02d:00. Uma leitura a cada %d s (= %d min simulados).\n",
                HORA_INICIAL, SEGUNDOS_ENTRE_ENVIOS, MINUTOS_POR_ENVIO);
  Serial.println("Gire o REGISTRO, aperte DESCARGA ou suba o slider do LDR (abrir a tampa).");
  ultimoEnvio = millis();
}

void loop() {
  conectarMqtt();
  mqtt.loop();

  // Botão DESCARGA: cada aperto liga ou desliga o vazamento
  bool botaoAgora = digitalRead(PINO_DESCARGA);
  if (botaoAntes == HIGH && botaoAgora == LOW) {
    descargaLigada = !descargaLigada;
    Serial.printf(">> Descarga pingando: %s\n", descargaLigada ? "LIGADA" : "desligada");
    delay(200);   // evita contar o mesmo aperto duas vezes
  }
  botaoAntes = botaoAgora;

  // A cada 5 s: passa 10 min de água, monta a leitura e envia
  if (millis() - ultimoEnvio >= SEGUNDOS_ENTRE_ENVIOS * 1000UL) {
    ultimoEnvio = millis();
    lerSensorTampa();
    double vazao = lerRegistro() + (descargaLigada ? 0.33 : 0);
    passarAgua(vazao);
    avancarRelogio();
    montarLeitura();
    enviarFila();
  }
}
