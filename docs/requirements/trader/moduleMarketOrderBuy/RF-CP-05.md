## RF-CP-05 – Mostrar advertencia en mercado cerrado

### Descripción  
El sistema debe informar al usuario sobre los riesgos de realizar una orden fuera de horario.

### Actor(es)  
- Sistema  

### Precondiciones  
- Mercado cerrado  

### Flujo básico  
1. El sistema muestra mensaje:

"El mercado está cerrado. Tu orden se ejecutará a precio de apertura en horario hábil. El precio puede variar respecto al valor actual."

2. El usuario decide continuar o cancelar  