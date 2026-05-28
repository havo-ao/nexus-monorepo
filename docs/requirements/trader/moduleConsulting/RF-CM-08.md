## RF-CM-08 – Ejecutar contrato de operación

### Descripción  
El sistema debe permitir al comisionista ejecutar operaciones directamente sobre el portafolio del trader.

### Actor(es)  
- Comisionista  

### Precondiciones  
- Estado: `ACTIVO`  
- Tipo: Operación  

### Flujo básico  
1. El comisionista realiza operación  
2. El sistema ejecuta la operación  
3. El sistema notifica al trader  

### Flujos alternos  
- N/A  

### Postcondiciones  
- La operación queda registrada  

### Reglas de negocio  
- RN-CM-06: El comisionista tiene control total sobre el portafolio durante el contrato  
- RN-CM-07: El trader es notificado de todas las acciones  
