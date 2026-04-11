export default async function handler(request, response) {
  return response.status(200).json({ 
    status: 'BoutiKonect API is Healthy (Root v2.0)', 
    timestamp: new Date().toISOString()
  });
}
