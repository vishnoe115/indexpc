export default {
    async fetch(request, env) {
      const url = new URL(request.url);
      const pathname = url.pathname;
  
      // CORS headers for all responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
  
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      // --- Authentication (login) ---
      if (pathname === "/api/auth/login" && request.method === "POST") {
        const { username, password } = await request.json();
      
        if (username === env.PCLOUD_USERNAME && password === env.PCLOUD_PASSWORD) {
          const token = await signJWT({ user: username }, env.JWT_SECRET, 43200); // 12h
          return jsonResponse({ token, user: { username } }, 200, corsHeaders);
        } else {
          return jsonResponse({ error: "Invalid credentials" }, 401, corsHeaders);
        }
      }
  
      // --- All other /api routes require auth ---
      if (pathname.startsWith("/api") && !(pathname === "/api/download" && url.searchParams.get("stream") === "1")) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
        }
        
        const token = authHeader.split(" ")[1];
        try {
          await verifyJWT(token, env.JWT_SECRET);
        } catch (err) {
          return jsonResponse({ error: err.message }, 401, corsHeaders);
        }
      }
  
      // --- Files listing ---
      if (pathname === "/api/files") {
        const path = url.searchParams.get("path") || "/";
        try {
          const resp = await fetch(
            `https://eapi.pcloud.com/listfolder?path=${encodeURIComponent(path)}&access_token=${env.PCLOUD_TOKEN}`
          );
          const data = await resp.json();
          
          console.log('pCloud API response:', JSON.stringify(data, null, 2)); // Debug log
          
          if (data.result !== 0) {
            return jsonResponse({ error: data.error || 'Failed to list files' }, 400, corsHeaders);
          }
          
          // Extract the contents from metadata if it exists
          let contents = [];
          if (data.metadata && data.metadata.contents) {
            contents = data.metadata.contents;
          } else if (data.contents) {
            contents = data.contents;
          }
          
          // Return in the format expected by frontend
          return jsonResponse({ 
            ...data,
            contents: contents 
          }, 200, corsHeaders);
        } catch (error) {
          console.error('Files API error:', error);
          return jsonResponse({ error: 'Failed to fetch files' }, 500, corsHeaders);
        }
      }
  
      // --- Storage info ---
      if (pathname === "/api/storage") {
        try {
          const resp = await fetch(`https://eapi.pcloud.com/userinfo?access_token=${env.PCLOUD_TOKEN}`);
          const data = await resp.json();
          return jsonResponse({ usedquota: data.usedquota, quota: data.quota }, 200, corsHeaders);
        } catch (error) {
          return jsonResponse({ error: 'Failed to fetch storage info' }, 500, corsHeaders);
        }
      }
  
      // --- Download ---
      if (pathname === "/api/download") {
        const fileId = url.searchParams.get("fileId");
        const fileName = url.searchParams.get("name") || fileId; // fallback
  
        if (!fileId) return jsonResponse({ error: "Missing fileId" }, 400, corsHeaders);
  
        try {
          const linkResp = await fetch(
            `https://eapi.pcloud.com/getfilelink?fileid=${fileId}&access_token=${env.PCLOUD_TOKEN}`
          );
          const linkData = await linkResp.json();
  
          if (!linkData?.hosts || linkData.result !== 0) {
            return jsonResponse({ error: "Failed to generate link" }, 500, corsHeaders);
          }
  
          const host = linkData.hosts[0];
          const path = linkData.path;
          const pcloudFileUrl = `https://${host}${path}`;
  
          // ?stream=1 → stream file directly
          if (url.searchParams.get("stream") === "1") {
            const fileResp = await fetch(pcloudFileUrl);
            return new Response(fileResp.body, {
              headers: {
                ...corsHeaders,
                "Content-Type": fileResp.headers.get("Content-Type") || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${fileName}"`,
              },
            });
          }
  
          // else return Worker link (for copy/share)
          const workerLink = `${url.origin}/api/download?fileId=${fileId}&name=${encodeURIComponent(fileName)}&stream=1`;
          return jsonResponse({ link: workerLink }, 200, corsHeaders);
  
        } catch (error) {
          return jsonResponse({ error: 'Failed to generate download link' }, 500, corsHeaders);
        }
      }
  
      return new Response("✅ pCloud Worker backend running", { 
        status: 200, 
        headers: corsHeaders 
      });
    },
  };
  
  // --- Helper ---
  function jsonResponse(obj, status = 200, additionalHeaders = {}) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { 
        "Content-Type": "application/json",
        ...additionalHeaders
      },
    });
  }
  
  // Base64URL helpers
  function base64urlEncode(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  
  function base64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  
  // Sign JWT with HS256
  async function signJWT(payload, secret, expiresInSec = 43200) {
    const header = { alg: "HS256", typ: "JWT" };
    const exp = Math.floor(Date.now() / 1000) + expiresInSec;
    const body = { ...payload, exp };
  
    const headerB64 = base64urlEncode(new TextEncoder().encode(JSON.stringify(header)));
    const bodyB64   = base64urlEncode(new TextEncoder().encode(JSON.stringify(body)));
    const data = `${headerB64}.${bodyB64}`;
  
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    const sigB64 = base64urlEncode(sigBuf);
  
    return `${data}.${sigB64}`;
  }
  
  // Verify JWT
  async function verifyJWT(token, secret) {
    const [headerB64, bodyB64, sigB64] = token.split(".");
    if (!headerB64 || !bodyB64 || !sigB64) throw new Error("Malformed token");
  
    const data = `${headerB64}.${bodyB64}`;
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
    );
  
    const sigBuf = base64urlDecode(sigB64);
    const valid = await crypto.subtle.verify("HMAC", key, sigBuf, new TextEncoder().encode(data));
    if (!valid) throw new Error("Invalid signature");
  
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(bodyB64)));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }
    return payload;
  }