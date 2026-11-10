FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["GotaCerta.Api/GotaCerta.Api.csproj", "GotaCerta.Api/"]
RUN dotnet restore "GotaCerta.Api/GotaCerta.Api.csproj"
COPY . .
WORKDIR "/src/GotaCerta.Api"
RUN dotnet publish "GotaCerta.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "GotaCerta.Api.dll"]
