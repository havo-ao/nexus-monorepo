## RF-PL-12 – Restringir funcionalidades premium tras downgrade

### Descripción  
El sistema debe impedir el uso de funcionalidades Premium cuando el usuario no posee un plan activo.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario tiene plan Free  

### Flujo básico  
1. El usuario intenta acceder a una funcionalidad Premium  
2. El sistema valida el tipo de plan  
3. El sistema bloquea el acceso  
4. El sistema sugiere adquirir el plan Premium  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El acceso a funcionalidades Premium es restringido  

### Reglas de negocio  
- RN-PL-14: Solo usuarios con plan Premium activo pueden usar funcionalidades PRM  
