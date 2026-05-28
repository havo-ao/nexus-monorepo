## RF-PL-11 – Conservar configuraciones premium

### Descripción  
El sistema debe conservar las configuraciones Premium del usuario incluso después de un downgrade a Free.

### Actor(es)  
- Sistema  

### Precondiciones  
- El usuario ha tenido plan Premium previamente  

### Flujo básico  
1. El sistema almacena configuraciones Premium del usuario  
2. En caso de downgrade, las configuraciones no se eliminan  
3. Al renovar el plan, el sistema restaura automáticamente las configuraciones  

### Flujos alternos  
- N/A  

### Postcondiciones  
- Las configuraciones Premium son reutilizadas  

### Reglas de negocio  
- RN-PL-13: Las configuraciones deben persistir independientemente del estado del plan  
