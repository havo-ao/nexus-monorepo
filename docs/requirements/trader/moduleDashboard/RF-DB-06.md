## RF-DB-06 – Actualizar datos de mercado

### Descripción  
El sistema debe actualizar la información de las acciones en el dashboard.

### Actor(es)  
- Sistema  

### Flujo básico  
1. El sistema consulta datos de mercado  
2. El sistema actualiza información visible  
3. El sistema refleja cambios en el dashboard  

### Flujos alternos  
- 1A. Error en obtención de datos  
  - El sistema mantiene última información disponible  

### Postcondiciones  
- El usuario visualiza datos actualizados  

### Reglas de negocio  
- RN-DB-05: La actualización debe realizarse en intervalos definidos  
