# Requisitos Funcionales – Sección Notificaciones  
## Sistema: Nexus

---

## Descripción del Módulo

Este módulo permite al trader gestionar las notificaciones del sistema, incluyendo su activación, desactivación y canal de recepción. Aplica a eventos de seguridad, operaciones, suscripción, validación y comisionistas.

---

## RF-NT-01 – Visualizar configuración de notificaciones

### Descripción  
El sistema debe permitir al trader visualizar todas las categorías de notificaciones disponibles.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario ha iniciado sesión  

### Flujo básico  
1. El sistema muestra categorías:
   - Seguridad  
   - Suscripción  
   - Operaciones  
   - Validación  
   - Comisionistas  
2. El sistema muestra el estado actual (activo/inactivo)  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario visualiza su configuración  
