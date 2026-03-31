## RF-ON-04 – Reenviar información financiera

### Descripción  
El sistema debe permitir al usuario reenviar su información financiera para validación en caso de rechazo o error.

### Actor(es)  
- Trader  

### Precondiciones  
- Estado: `RECHAZADO` o `ERROR_TECNICO`  

### Flujo básico  
1. El usuario accede al módulo financiero  
2. El usuario modifica la información  
3. El sistema guarda los cambios  
4. El sistema cambia estado a `PENDIENTE_ENVIO`  
5. Se reintenta el envío  

### Flujos alternos  
- N/A  

### Postcondiciones  
- La información es reenviada para validación  

### Reglas de negocio  
- RN-ON-04: No existe límite de reintentos  

