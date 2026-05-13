# Nexus

## Inicio local con Docker

Desde PowerShell, ejecutar:

```powershell
.\infrastructure\docker\start-local.ps1
```

El script crea `infrastructure/docker/.env` si no existe, genera valores locales
para las variables sensibles y levanta el entorno con Docker Compose. Ese archivo
local no se versiona en Git.

Plataforma académica de trading desarrollada para la materia de Arquitectura de Software.

## Estructura del repositorio

webapp/
Aplicación web del sistema.

services/
Microservicios del backend.

infrastructure/
Configuración de infraestructura y Docker.

docs/
Documentación del proyecto y arquitectura.
