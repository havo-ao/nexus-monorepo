## RF-CM-10 – Finalizar contrato por vencimiento

### Descripción  
El sistema debe finalizar automáticamente un contrato al cumplir su duración.

### Actor(es)  
- Sistema  

### Precondiciones  
- Fecha de finalización alcanzada  

### Flujo básico  
1. El sistema detecta vencimiento  
2. El sistema cambia estado a `FINALIZADO`  
3. El sistema notifica a ambas partes  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El contrato queda finalizado  
