## RF-VTC-05 – Evaluar órdenes al cierre del mercado

### Descripción  
El sistema debe evaluar órdenes pendientes al finalizar la jornada de mercado.

### Actor(es)  
- Sistema  

### Flujo básico  

1. El sistema identifica órdenes no ejecutadas  
2. El sistema solicita al trader decidir:

- continuar monitoreo  
- cancelar orden  

### Flujos alternos  

**2A – Continuar**

- la orden permanece activa  

**2B – Cancelar**

- la orden cambia a estado `CANCELADA`
- se liberan acciones reservadas  
