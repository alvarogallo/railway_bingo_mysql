<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Control de Ambiente</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            border: 1px solid #ccc;
            padding: 20px;
            border-radius: 5px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        .stat-card h4 {
            margin: 0;
            color: #333;
        }
        .stat-card p {
            margin: 10px 0 0;
            font-size: 24px;
            color: #0066cc;
        }
        .connections-list {
            margin-top: 20px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Control de Ambiente</h2>
        
        <div id="statsContainer" class="stats">
            <!-- Estadísticas se cargarán aquí -->
        </div>

        <div class="form-group">
            <input type="text" id="newItem" placeholder="Nuevo item">
            <button onclick="addItemToAmbiente(document.getElementById('newItem').value)">
                Agregar Item
            </button>
            <button onclick="resetAmbiente()" style="margin-left: 10px; background-color: #ff4444; color: white;">
                Reset Ambiente
            </button>
        </div>

        <div id="status">
            Cargando...
        </div>

        <div id="connections" class="connections-list">
            <!-- Lista de conexiones se cargará aquí -->
        </div>
    </div>

    <script src="/apiRequests.js"></script>
</body>
</html>