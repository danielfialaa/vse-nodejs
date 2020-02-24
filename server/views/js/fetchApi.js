export async function api(url = '', method = '', data = {}) {
    const response = await fetch(url, {
      method: method, // GET, POST, PUT ...
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: method === 'get' ? undefined : JSON.stringify(data) 
    });
    return await response.json();
}