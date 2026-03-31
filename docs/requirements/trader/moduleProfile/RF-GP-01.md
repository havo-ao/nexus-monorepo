# Requisitos Funcionales – Sección Gestión de Perfil  
## Sistema: Nexus

---

## Descripción del Módulo

Este módulo permite al trader gestionar su información personal y financiera registrada en el sistema, garantizando la validación de datos sensibles.

---

## RF-GP-01 – Visualizar datos personales

### Descripción  
El sistema debe permitir al trader visualizar su información personal registrada.

### Actor(es)  
- Trader  

### Precondiciones  
- Usuario autenticado  

### Flujo básico  
1. El sistema muestra:
   - Correo electrónico  
   - Número telefónico  
   - Nombres  
   - Apellidos  
   - Sexo  
   - Nacionalidad  
   - Zona horaria  
   - Experiencia en trading  

### Reglas de negocio  
- RN-GP-01: La contraseña no debe ser visible ni editable  