## RF-PL-04 – Omitir selección de plan premium

### Descripción  
El sistema debe permitir al usuario omitir la adquisición del plan Premium y continuar con el plan Free.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario se encuentra en la pantalla de selección de plan  

### Flujo básico  
1. El usuario selecciona continuar con el plan Free  
2. El sistema asigna el plan Free al usuario  
3. El sistema redirige al siguiente módulo (servicio de comisionistas)  

### Flujos alternos  
- N/A  

### Postcondiciones  
- El usuario continúa con funcionalidades básicas  

### Reglas de negocio  
- RN-PL-06: El plan Free debe permanecer activo si no se adquiere el Premium  
