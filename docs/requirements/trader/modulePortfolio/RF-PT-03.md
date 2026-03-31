## RF-PT-03 – Calcular rendimiento de la posición

### Descripción  
El sistema debe calcular las métricas de rendimiento de cada acción.

### Actor(es)  
- Sistema  

### Flujo básico  
1. El sistema calcula valor invertido:(Valor Invertido = Precio Promedio Compra × Cantidad)
2. El sistema calcula valor actual:(Valor Actual = Precio Actual × Cantidad)
3. El sistema calcula ganancia o pérdida:(Ganancia/Pérdida = Valor Actual − Valor Invertido)
4. El sistema calcula porcentaje de rendimiento.
   
### Postcondiciones  
- El usuario visualiza el rendimiento actualizado  