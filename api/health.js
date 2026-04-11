export default async function handler(request, response) {
  return response.status(200).json({ 
    status: 'BoutiKonect API is Healthy', 
    timestamp: new Date().toISOString(),
    node_version: process.version
  });
}
