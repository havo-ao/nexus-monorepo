
## RF-PL-06 – Notificar próxima expiración del plan premium

### Descripción  
El sistema debe notificar al trader cuando su plan Premium esté próximo a expirar.

### Actor(es)  
- Sistema  
- Trader Premium  

### Precondiciones  
- El usuario posee un plan Premium activo  
- Existe una fecha de expiración asociada  

### Flujo básico  
1. El sistema identifica planes próximos a expirar  
2. El sistema envía notificación al usuario 8 días previos a la expiración  
3. El sistema informa la fecha límite de renovación  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario es informado oportunamente de la expiración  

### Reglas de negocio  
- RN-PL-08: La notificación debe enviarse con anticipación suficiente para permitir renovación  
