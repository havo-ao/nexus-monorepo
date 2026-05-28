## RF-CM-06 – Aprobar contrato

### Descripción  
El sistema debe permitir que ambas partes aprueben el contrato para su activación.

### Actor(es)  
- Trader  
- Comisionista  

### Precondiciones  
- Estado: `EN_NEGOCIACION`  

### Flujo básico  
1. El trader aprueba el contrato  
2. El comisionista aprueba el contrato  
3. El sistema cambia estado a `ACTIVO`  

### Flujos alternos  
- 1A. Una de las partes rechaza  
  - El contrato pasa a `CANCELADO`  

### Postcondiciones  
- El contrato queda activo  

### Reglas de negocio  
- RN-CM-04: Ambas partes deben aprobar para activar el contrato  