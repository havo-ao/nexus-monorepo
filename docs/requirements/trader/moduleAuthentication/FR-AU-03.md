## RF-AU-03 – Verificar número telefónico

### Descripción  
El sistema debe verificar el número telefónico del usuario mediante el envío de un código SMS.

### Actor(es)  
- Trader con correo verificado  

### Precondiciones  
- Estado: `VERIFICADO_EMAIL`  

### Flujo básico  
1. El sistema envía un código SMS  
2. El usuario ingresa el código recibido  
3. El sistema valida el código  
4. El sistema actualiza el estado a `VERIFICADO`  

### Flujos alternos  
- 2A. Código incorrecto  
  - El sistema solicita reintento  

- 2B. Código expirado  
  - El sistema permite solicitar reenvío  

### Postcondiciones  
- El número telefónico queda verificado  

### Reglas de negocio  
- RN-AU-04: El usuario no puede continuar sin verificar el número telefónico  
