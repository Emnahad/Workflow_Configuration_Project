# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

# Expose ports
EXPOSE 8080
EXPOSE 443
ENV ASPNETCORE_ENVIRONMENT=Development 

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
# Copy csproj files for all projects and restore dependencies
COPY ["Reporting.Application/Reporting.Application.csproj", "Reporting.Application/"]
COPY ["Reporting.Core/Reporting.Core.csproj", "Reporting.Core/"]
COPY ["Reporting.Infrastracture/Reporting.Infrastracture.csproj", "Reporting.Infrastracture/"]
COPY ["ReportingBackEnd/ReportingBackEnd.csproj", "ReportingBackEnd/"]

# Restore dependencies for ReportingBackEnd
RUN dotnet restore "ReportingBackEnd/ReportingBackEnd.csproj"

# Copy the entire source code
COPY . .

# Build the application in Release mode
WORKDIR "/src/ReportingBackEnd"
RUN dotnet build "ReportingBackEnd.csproj" -c Release -o /app/build 

# Stage 2: Publish the application
FROM build AS publish
RUN dotnet publish "ReportingBackEnd.csproj" -c Release -o /app/publish /p:UseAppHost=false



FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .


# Set the entry point to run the application
ENTRYPOINT ["dotnet", "ReportingBackEnd.dll"]
