## PRM-FR-03 – Gestionar configuración de seguridad avanzada

### Descripción  
El sistema debe permitir al trader gestionar opciones avanzadas de seguridad asociadas al MFA.

### Actor(es)  
- Trader Premium  

### Precondiciones  
- El usuario posee plan Premium activo  

### Flujo básico  
1. El usuario accede a configuración de seguridad  
2. El usuario activa o desactiva MFA  
3. El usuario selecciona medio de verificación (SMS o correo)  
4. El usuario modifica datos de contacto si lo desea  
5. El sistema solicita nueva validación de los datos modificados  

### Flujos alternos  
- 4A. Datos inválidos  
  - El sistema solicita corrección  

### Postcondiciones  
- La configuración de seguridad queda actualizada  

### Reglas de negocio  
- RN-PRM-03: El MFA solo está disponible para usuarios Premium  
- RN-PRM-04: Cualquier cambio en datos de contacto requiere revalidación  
