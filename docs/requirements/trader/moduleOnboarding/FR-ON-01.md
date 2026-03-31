## RF-ON-01 – Registrar información financiera

### Descripción
El sistema debe permitir al usuario registrar la información financiera requerida para la creación de su cuenta de trading.

### Actor(es)  
- Trader verificado  

### Precondiciones  
- Estado: `VERIFICADO`  

### Flujo básico  
1. El sistema solicita información financiera incluyendo:
   - Dirección  
   - Fecha de nacimiento  
   - Información fiscal  
   - Fuente de ingresos  
   - Declaraciones legales  
   - Documentos de identidad  
2. El usuario diligencia la información  
3. El sistema valida formato de datos  
4. El sistema almacena la información localmente  
5. El sistema asigna estado: `PENDIENTE_ENVIO`  

### Flujos alternos  
- 2A. Datos incompletos  
  - El sistema solicita completar información  

- 3A. Documento inválido  
  - El sistema solicita corrección  

### Postcondiciones  
- La información financiera queda almacenada en el sistema  

### Reglas de negocio  
- RN-ON-01: La información debe cumplir con la estructura requerida para validación externa  
