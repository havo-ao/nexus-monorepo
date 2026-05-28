## RF-CMT-05 – Calcular comisiones de contrato

### Descripción  
El sistema debe calcular las comisiones generadas durante un contrato.

### Flujo básico  
1. Para cada operación:
   - calcula valor de transacción  
   - aplica comisión  
2. Divide comisión:
   - 40% comisionista  
   - 60% Nexus  
3. Calcula totales acumulados  

### Reglas de negocio  
- RN-CMT-02: La fórmula de cálculo debe aplicarse a cada operación  
- RN-CMT-03: Se debe mostrar total pagado a comisionista y a la plataforma  
