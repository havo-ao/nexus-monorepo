## RF-ON-02 – Enviar información a validación externa

### Descripción  
El sistema debe enviar la información financiera del usuario a un servicio externo para su validación.

### Actor(es)  
- Sistema  

### Precondiciones  
- Estado: `PENDIENTE_ENVIO`  

### Flujo básico  
1. El sistema envía los datos financieros  
2. El sistema actualiza estado a `EN_VALIDACION`  

### Flujos alternos  
- 1A. Error técnico en envío  
  - El sistema asigna estado `ERROR_TECNICO`  

### Postcondiciones  
- La solicitud queda en proceso de validación  

### Reglas de negocio  
- RN-ON-02: El envío debe registrarse para trazabilidad  

