## PRM-FR-01 – Configurar alertas personalizadas

### Descripción  
El sistema debe permitir al trader configurar alertas personalizadas sobre el valor de acciones específicas.

### Actor(es)  
- Trader Premium  

### Precondiciones  
- El usuario posee plan Premium activo  

### Flujo básico  
1. El usuario selecciona una acción  
2. El usuario define valores mínimos y máximos  
3. El sistema guarda la configuración  
4. El sistema monitorea los valores de la acción  
5. El sistema envía notificaciones SMS cuando se cumplen condiciones  

### Flujos alternos  
- 2A. Valores inválidos  
  - El sistema solicita corrección  

### Postcondiciones  
- Las alertas quedan configuradas  

### Reglas de negocio  
- RN-PRM-01: Las notificaciones deben enviarse vía SMS  
