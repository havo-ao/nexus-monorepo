## RF-CM-09 – Cancelar contrato

### Descripción  
El sistema debe permitir al trader cancelar un contrato activo en cualquier momento.

### Actor(es)  
- Trader  

### Precondiciones  
- Estado: `ACTIVO`  

### Flujo básico  
1. El trader solicita cancelación  
2. El sistema registra cancelación  
3. El sistema cambia estado a `CANCELADO`  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El contrato finaliza  

### Reglas de negocio  
- RN-CM-08: No se permite reembolso  
