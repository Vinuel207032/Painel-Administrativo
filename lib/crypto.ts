
export async function generateHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  // Concatena o "salt" fixo "clube" com a senha do usuário
  const data = encoder.encode("clube" + password);
  
  // Gera o hash SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Converte o buffer para string Hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}
