# Requisitos Funcionales – Dashboard de Trading  
## Sistema: Nexus

---

## Descripción del Módulo

Este módulo permite al trader visualizar información del mercado, gestionar su watchlist (si es usuario premium) y acceder a funcionalidades de consulta y operación sobre acciones.

---

## RF-DB-01 – Visualizar dashboard principal

### Descripción  
El sistema debe mostrar un dashboard con información resumida de acciones según el tipo de plan del usuario.

### Actor(es)  
- Trader  

### Precondiciones  
- Usuario autenticado  
- Usuario con acceso habilitado (estado APROBADO)  

### Flujo básico  
1. El sistema identifica el tipo de plan  
2. Si es Premium:
   - muestra acciones de la watchlist  
3. Si es Free:
   - muestra 4 acciones seleccionadas aleatoriamente  
4. El sistema presenta información básica de cada acción  

### Flujos alternos  
- 2A. Watchlist vacía  
  - El sistema muestra mensaje informativo  

### Postcondiciones  
- El usuario visualiza acciones relevantes  

### Reglas de negocio  
- RN-DB-01: El plan Free solo muestra 4 acciones  
- RN-DB-02: El plan Premium muestra la watchlist configurada  