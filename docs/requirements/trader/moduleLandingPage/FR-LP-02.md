## RF-LP-02 – Visualizar mercados disponibles

### Descripción  
El sistema debe permitir al usuario visualizar los mercados financieros disponibles dentro de la plataforma, junto con ejemplos representativos de acciones que pueden ser negociadas.

### Actor(es)  
- Trader (no autenticado)

### Precondiciones  
- El usuario accede a la landing page  

### Flujo básico  
1. El sistema presenta la lista de mercados disponibles (NYSE, NASDAQ, LSE, TSE, ASX)  
2. El sistema muestra acciones representativas por cada mercado  
3. La información se presenta de forma estática (sin datos en tiempo real)  

### Flujos alternos  
- No aplica  

### Postcondiciones  
- El usuario identifica los mercados disponibles en la plataforma  

### Reglas de negocio  
- RN-02: No se deben mostrar datos en tiempo real en la landing page  