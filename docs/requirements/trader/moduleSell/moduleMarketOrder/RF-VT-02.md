## RF-VT-02 – Validar cantidad de acciones

### Descripción  
El sistema debe verificar que la cantidad de acciones a vender sea válida.

### Actor(es)  
- Sistema  

### Flujo básico  
1. El sistema compara cantidad solicitada con acciones disponibles  
2. Si la cantidad es válida continúa el proceso  

### Flujos alternos  

**2A – Cantidad inválida**

- El sistema informa error  

### Reglas de negocio  

- RN-VT-01: No se puede vender más acciones de las disponibles  
