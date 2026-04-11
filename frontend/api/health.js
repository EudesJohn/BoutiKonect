export default async function handler(request, response) {
  return response.status(200).json({ 
    status: 'BoutiKonect API is Healthy (Frontend Level)', 
    timestamp: new Date().toISOString()
  });
}
