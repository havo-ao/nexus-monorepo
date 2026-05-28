const kibanaUrl = process.env.KIBANA_URL || 'http://127.0.0.1:5601';
const dataViewTitle = 'acciones-elbosque-logs-*';
const dataViewName = 'Acciones ElBosque Logs';

async function request(path, options = {}) {
  const response = await fetch(`${kibanaUrl}${path}`, {
    ...options,
    headers: {
      'kbn-xsrf': 'true',
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function waitForKibana() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await request('/api/status');
      return;
    } catch (error) {
      if (attempt === 30) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function findDataView() {
  const response = await request('/api/data_views');
  return response.data_view?.find((dataView) => dataView.title === dataViewTitle);
}

async function createDataView() {
  const response = await request('/api/data_views/data_view', {
    method: 'POST',
    body: JSON.stringify({
      data_view: {
        title: dataViewTitle,
        name: dataViewName,
        timeFieldName: '@timestamp',
      },
    }),
  });

  return response.data_view;
}

async function setDefaultDataView(dataViewId) {
  await request('/api/data_views/default', {
    method: 'POST',
    body: JSON.stringify({
      data_view_id: dataViewId,
      force: true,
    }),
  });
}

await waitForKibana();

const dataView = (await findDataView()) || (await createDataView());
await setDefaultDataView(dataView.id);

console.log(`Kibana data view ready: ${dataView.title}`);
