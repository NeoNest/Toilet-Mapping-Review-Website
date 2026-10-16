import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  Accessibility,
  ArrowDownUp,
  ArrowRight,
  Check,
  CircleDollarSign,
  LocateFixed,
  MapPin,
  Menu,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Toilet,
  X,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import './App.css'
import {
  createSharedReview,
  createSharedSpot,
  loadSharedSpots,
  supabaseConfigured,
  supabaseConfigurationIncomplete,
  type Review,
  type ToiletSpot,
} from './lib/toilets'

type Filter = 'all' | 'free' | 'accessible' | 'top'

const starterSpots: ToiletSpot[] = [
  {
    id: 'bali-canggu',
    name: 'The Shady Shack',
    area: 'Canggu, Badung',
    city: 'Canggu',
    province: 'Bali',
    lat: -8.6508,
    lng: 115.1366,
    rating: 4.8,
    price: 0,
    amenities: ['Free', 'Clean', 'Accessible'],
    image:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85',
    description: 'A spotless, well-kept restroom tucked behind the cafe. No purchase needed.',
    verified: true,
    reviews: [
      {
        id: 'r-bali-1',
        author: 'Maya S.',
        date: '2 days ago',
        rating: 5,
        text: 'Super clean and easy to find. The staff were lovely too!',
      },
      {
        id: 'r-bali-2',
        author: 'Arif P.',
        date: '1 week ago',
        rating: 4,
        text: 'A great stop while exploring Canggu. There was soap and running water.',
      },
    ],
  },
  {
    id: 'jakarta-kota',
    name: 'Kota Tua Visitor Centre',
    area: 'Pinangsia, Jakarta Barat',
    city: 'Jakarta',
    province: 'DKI Jakarta',
    lat: -6.1352,
    lng: 106.8133,
    rating: 4.4,
    price: 2000,
    amenities: ['Clean', 'Water', 'Accessible'],
    image:
      'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=85',
    description: 'Public facilities near the museum square. Bring a few thousand rupiah.',
    verified: true,
    reviews: [
      {
        id: 'r-jkt-1',
        author: 'Dewi R.',
        date: 'Yesterday',
        rating: 4,
        text: 'Convenient location, attendant was keeping it tidy.',
      },
    ],
  },
  {
    id: 'bandung-braga',
    name: 'Braga Citywalk',
    area: 'Braga, Bandung',
    city: 'Bandung',
    province: 'West Java',
    lat: -6.9175,
    lng: 107.6098,
    rating: 4.6,
    price: 0,
    amenities: ['Free', 'Clean', 'Water'],
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=85',
    description: 'Modern mall restrooms with good lighting, running water, and changing tables.',
    verified: true,
    reviews: [
      {
        id: 'r-bdg-1',
        author: 'Nadia K.',
        date: '3 days ago',
        rating: 5,
        text: 'Clean, free, and open late. Just follow the signs upstairs.',
      },
    ],
  },
  {
    id: 'yogya-tugu',
    name: 'Stasiun Tugu',
    area: 'Sosromenduran, Yogyakarta',
    city: 'Yogyakarta',
    province: 'DI Yogyakarta',
    lat: -7.7892,
    lng: 110.3638,
    rating: 4.1,
    price: 2000,
    amenities: ['Water', 'Open late'],
    image:
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=900&q=85',
    description: 'Paid station facilities that are open around the clock. Usually busy at peak times.',
    verified: false,
    reviews: [
      {
        id: 'r-yog-1',
        author: 'Bima T.',
        date: '5 days ago',
        rating: 4,
        text: 'Useful while waiting for a train. Take coins for the attendant.',
      },
    ],
  },
]

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All spots' },
  { id: 'free', label: 'Free' },
  { id: 'accessible', label: 'Accessible' },
  { id: 'top', label: 'Top rated' },
]

const pinIcon = (active: boolean) =>
  L.divIcon({
    className: 'map-pin-shell',
    html: `<span class="map-pin${active ? ' map-pin-active' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h10v17H7zM9 6h6M9 9h6M9 12h6M9 15h3"/></svg></span>`,
    iconSize: [38, 46],
    iconAnchor: [19, 43],
  })

function MapFocus({ spot }: { spot: ToiletSpot | undefined }) {
  const map = useMap()

  useEffect(() => {
    if (spot) map.setView([spot.lat, spot.lng], Math.max(map.getZoom(), 12), { animate: false })
  }, [map, spot])

  return null
}

function readSavedSpots(): ToiletSpot[] {
  try {
    const saved = localStorage.getItem('toilet-map-spots')
    if (!saved) return starterSpots
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) throw new Error('Saved toilet listings are not a list.')
    return parsed as ToiletSpot[]
  } catch (error) {
    console.error('Could not read saved toilet listings.', error)
    return starterSpots
  }
}

function App() {
  const [spots, setSpots] = useState<ToiletSpot[]>(() =>
    supabaseConfigured ? [] : readSavedSpots(),
  )
  const [isLoadingSpots, setIsLoadingSpots] = useState(supabaseConfigured)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [spotsLoadError, setSpotsLoadError] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('pispot-theme') === 'dark'
    } catch (error) {
      console.error('Could not read the saved appearance preference.', error)
      return false
    }
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [sortByRating, setSortByRating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [mobileListOpen, setMobileListOpen] = useState(false)
  const [toast, setToast] = useState(
    supabaseConfigurationIncomplete
      ? 'Supabase setup is incomplete. This is running in local demo mode.'
      : '',
  )
  const [spotError, setSpotError] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [newSpot, setNewSpot] = useState({
    name: '',
    area: '',
    city: '',
    province: '',
    price: '0',
    lat: '-8.65',
    lng: '115.14',
    amenities: 'Clean, Water',
  })
  const [newReview, setNewReview] = useState({ author: '', rating: 5, text: '' })

  useEffect(() => {
    if (!supabaseConfigured) {
      if (supabaseConfigurationIncomplete) {
        console.error('Supabase setup is incomplete; both environment variables are required.')
      }
      return
    }
    let cancelled = false

    loadSharedSpots()
      .then((sharedSpots) => {
        if (!cancelled) setSpots(sharedSpots)
      })
      .catch((error: unknown) => {
        console.error('Could not load shared toilet data from Supabase.', error)
        if (!cancelled) {
          setSpotsLoadError(true)
          setToast('Could not load shared community data. Check your Supabase setup.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSpots(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (supabaseConfigured) return
    try {
      localStorage.setItem('toilet-map-spots', JSON.stringify(spots))
    } catch (error) {
      console.error('Could not save toilet listings in this browser.', error)
    }
  }, [spots])

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    try {
      localStorage.setItem('pispot-theme', darkMode ? 'dark' : 'light')
    } catch (error) {
      console.error('Could not save the appearance preference.', error)
    }
  }, [darkMode])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selectedSpot = spots.find((spot) => spot.id === selectedId)
  const visibleSpots = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filteredSpots = spots.filter((spot) => {
      const matchesSearch =
        !normalizedQuery ||
        `${spot.name} ${spot.area} ${spot.city} ${spot.province}`
          .toLowerCase()
          .includes(normalizedQuery)
      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'free' && spot.price === 0) ||
        (activeFilter === 'accessible' && spot.amenities.includes('Accessible')) ||
        (activeFilter === 'top' && spot.rating >= 4.5)
      return matchesSearch && matchesFilter
    })
    return sortByRating
      ? filteredSpots.sort((first, second) => second.rating - first.rating)
      : filteredSpots
  }, [activeFilter, query, sortByRating, spots])

  const updateSpot = (id: string, update: (spot: ToiletSpot) => ToiletSpot) => {
    setSpots((current) => current.map((spot) => (spot.id === id ? update(spot) : spot)))
  }

  const handleAddSpot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const lat = Number(newSpot.lat)
    const lng = Number(newSpot.lng)
    const price = Number(newSpot.price)
    if (
      !Number.isFinite(lat) ||
      lat < -11 ||
      lat > 6 ||
      !Number.isFinite(lng) ||
      lng < 95 ||
      lng > 141 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setToast('Enter a valid Indonesian map location and price.')
      return
    }

    const spotDetails = {
      name: newSpot.name.trim(),
      area: newSpot.area.trim(),
      city: newSpot.city.trim(),
      province: newSpot.province.trim(),
      lat,
      lng,
      price,
      amenities: newSpot.amenities
        .split(',')
        .map((amenity) => amenity.trim())
        .filter(Boolean),
    }
    setIsSubmitting(true)
    setSpotError('')
    try {
      const spot: ToiletSpot = supabaseConfigured
        ? await createSharedSpot(spotDetails)
        : {
            ...spotDetails,
            id: `spot-${Date.now()}`,
            rating: 0,
            image:
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
            description: 'A community-added toilet spot. Add a review to share your experience.',
            verified: false,
            reviews: [],
          }
      setSpots((current) => [spot, ...current])
      setSelectedId(spot.id)
      setShowAddForm(false)
      setNewSpot({
        name: '',
        area: '',
        city: '',
        province: '',
        price: '0',
        lat: String(lat),
        lng: String(lng),
        amenities: 'Clean, Water',
      })
      setToast(supabaseConfigured ? 'Toilet spot shared with the community.' : 'Toilet spot added to your map.')
    } catch (error) {
      console.error('Could not save the toilet spot.', error)
      setSpotError('Could not save this spot. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedSpot) return
    const author = newReview.author.trim()
    const text = newReview.text.trim()
    if (!author || !text) {
      setReviewError('Add your name and a short review to continue.')
      return
    }

    setIsSubmitting(true)
    setReviewError('')
    try {
      const review: Review = supabaseConfigured
        ? await createSharedReview(selectedSpot.id, {
            author,
            rating: newReview.rating,
            text,
          })
        : {
            id: `review-${Date.now()}`,
            author,
            date: 'Just now',
            rating: newReview.rating,
            text,
          }
      updateSpot(selectedSpot.id, (spot) => {
        const reviews = [review, ...spot.reviews]
        return {
          ...spot,
          reviews,
          rating: reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length,
        }
      })
      setShowReviewForm(false)
      setNewReview({ author: '', rating: 5, text: '' })
      setToast(supabaseConfigured ? 'Thanks! Your review is shared with everyone.' : 'Thanks! Your review has been added.')
    } catch (error) {
      console.error('Could not save the toilet review.', error)
      setReviewError('Could not post your review. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const focusLocation = () => {
    if (!navigator.geolocation) {
      setToast('Location is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nearest = spots.reduce((best, spot) => {
          const toRadians = (degrees: number) => (degrees * Math.PI) / 180
          const latitudeDelta = toRadians(spot.lat - coords.latitude)
          const longitudeDelta = toRadians(spot.lng - coords.longitude)
          const distance =
            Math.sin(latitudeDelta / 2) ** 2 +
            Math.cos(toRadians(coords.latitude)) *
              Math.cos(toRadians(spot.lat)) *
              Math.sin(longitudeDelta / 2) ** 2
          return distance < best.distance ? { spot, distance } : best
        }, { spot: spots[0], distance: Number.POSITIVE_INFINITY })
        setSelectedId(nearest.spot.id)
        setToast('Showing toilets nearest to your location.')
      },
      () => setToast('Could not access your location. Check browser permissions.'),
    )
  }

  return (
    <main className="app-shell" data-theme={darkMode ? 'dark' : 'light'}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="Pispot home">
          <span className="brand-mark"><Toilet size={21} strokeWidth={2.2} /></span>
          <span>pispot<span className="brand-period">.</span></span>
        </a>
        <div className="topbar-tagline">Good stops, wherever you go.</div>
        <nav className="topnav" aria-label="Main navigation">
          <a className="topnav-active" href="#explore">Explore</a>
          <a href="#about">How it works</a>
        </nav>
        <button
          className="theme-toggle"
          type="button"
          onClick={() => setDarkMode((current) => !current)}
          aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
          aria-pressed={darkMode}
          title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          <span>{darkMode ? 'Light' : 'Dark'}</span>
        </button>
        <button className="button button-dark top-add-button" onClick={() => setShowAddForm(true)}>
          <Plus size={17} /> Add a spot
        </button>
      </header>

      <section className="intro" id="explore">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> COMMUNITY TOILET MAP</div>
          <h1>Find a little <em>relief.</em></h1>
          <p className="intro-copy">Real places, honest reviews. Find your next pit stop across Indonesia.</p>
        </div>
        <div className="intro-stats">
          <div><strong>{spots.length.toLocaleString('en')}</strong><span>spots shared</span></div>
          <div className="stat-divider" />
          <div><strong>{spots.reduce((total, spot) => total + spot.reviews.length, 0).toLocaleString('en')}</strong><span>helpful reviews</span></div>
        </div>
      </section>

      <section className="explorer" aria-label="Explore toilet locations">
        <div className={`listing-panel${mobileListOpen ? ' listing-panel-open' : ''}`}>
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a place or city"
              aria-label="Search by place or city"
            />
          </div>
          <div className="filter-row" role="group" aria-label="Filter toilet spots">
            {filters.map((filter) => (
              <button
                className={`filter-chip${activeFilter === filter.id ? ' filter-chip-active' : ''}`}
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                aria-pressed={activeFilter === filter.id}
              >
                {filter.id === 'free' && <CircleDollarSign size={14} />}
                {filter.id === 'accessible' && <Accessibility size={14} />}
                {filter.label}
              </button>
            ))}
          </div>
          <div className="list-heading">
            <div>
              <h2>Nearby spots <span>{visibleSpots.length}</span></h2>
              <p>Discover community favourites</p>
            </div>
            <button className="sort-button" onClick={() => setSortByRating((current) => !current)} aria-label="Sort by highest rated" title="Sort by rating">
              <ArrowDownUp size={15} />
            </button>
          </div>
          <div className="spot-list">
            {visibleSpots.map((spot) => (
              <button
                className={`spot-card${selectedId === spot.id ? ' spot-card-selected' : ''}`}
                key={spot.id}
                onClick={() => {
                  setSelectedId(spot.id)
                  setMobileListOpen(false)
                }}
              >
                <span className="spot-photo" style={{ backgroundImage: `url("${spot.image}")` }}>
                  {spot.price === 0 && <span className="photo-tag">FREE</span>}
                </span>
                <span className="spot-info">
                  <span className="spot-name-row">
                    <strong>{spot.name}</strong>
                    {spot.verified && <ShieldCheck size={15} className="verified-icon" aria-label="Community verified" />}
                  </span>
                  <span className="spot-area"><MapPin size={13} /> {spot.area}</span>
                  <span className="spot-meta">
                    <span className="rating"><Star size={13} fill="currentColor" /> {spot.rating ? spot.rating.toFixed(1) : 'New'}</span>
                    <span className="meta-dot" />
                    <span>{spot.reviews.length} reviews</span>
                    <span className="meta-price">{spot.price === 0 ? 'Free' : `Rp ${spot.price.toLocaleString('id-ID')}`}</span>
                  </span>
                </span>
                <ArrowRight className="spot-arrow" size={17} />
              </button>
            ))}
            {visibleSpots.length === 0 && isLoadingSpots && (
              <div className="empty-state"><span>Loading community spots…</span></div>
            )}
            {visibleSpots.length === 0 && !isLoadingSpots && spotsLoadError && (
              <div className="empty-state">
                <strong>Community spots could not be loaded</strong>
                <span>Check the Supabase URL, key, and database setup, then refresh.</span>
              </div>
            )}
            {visibleSpots.length === 0 && !isLoadingSpots && !spotsLoadError && (
              <div className="empty-state">
                <MapPin size={23} />
                <strong>No spots found just yet</strong>
                <span>Try another search or add the first one.</span>
                <button className="text-button" onClick={() => setShowAddForm(true)}>Add a toilet spot <ArrowRight size={14} /></button>
              </div>
            )}
          </div>
          <div className="list-footnote">
            <span className="footnote-pulse" />
            {supabaseConfigured
              ? 'Community data · shared with everyone'
              : supabaseConfigurationIncomplete
                ? 'Supabase setup incomplete · local demo only'
                : 'Demo · changes saved in this browser only'}
          </div>
        </div>

        <div className="map-panel">
          <MapContainer center={[-2.5, 117.5]} zoom={5} minZoom={4} maxZoom={18} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFocus spot={selectedSpot} />
            {spots.map((spot) => (
              <Marker
                key={spot.id}
                position={[spot.lat, spot.lng]}
                icon={pinIcon(selectedId === spot.id)}
                eventHandlers={{ click: () => setSelectedId(spot.id) }}
              />
            ))}
          </MapContainer>
          <div className="map-label"><span className="map-label-dot" /> INDONESIA <span>·</span> {spots.length} spots</div>
          <button className="locate-button" onClick={focusLocation} aria-label="Find nearest toilets to me">
            <LocateFixed size={18} />
          </button>
          <button className="mobile-list-button" onClick={() => setMobileListOpen((open) => !open)}>
            {mobileListOpen ? <X size={17} /> : <Menu size={17} />}
            {mobileListOpen ? 'Close list' : 'Browse spots'}
          </button>
          {selectedSpot && (
            <article className="map-preview">
              <button className="preview-image" style={{ backgroundImage: `url("${selectedSpot.image}")` }} onClick={() => setShowReviewForm(true)} aria-label={`Review ${selectedSpot.name}`}>
                <span className="preview-badge"><Star size={12} fill="currentColor" /> {selectedSpot.rating ? selectedSpot.rating.toFixed(1) : 'New'}</span>
              </button>
              <div className="preview-content">
                <div className="preview-topline">
                  <div>
                    <strong>{selectedSpot.name}</strong>
                    <span>{selectedSpot.area}</span>
                  </div>
                  <button className="icon-button preview-close" onClick={() => setSelectedId(null)} aria-label="Close toilet preview"><X size={17} /></button>
                </div>
                <div className="preview-amenities">
                  {selectedSpot.amenities.slice(0, 3).map((amenity) => <span key={amenity}>{amenity}</span>)}
                </div>
                <div className="preview-bottom">
                  <span>{selectedSpot.price === 0 ? 'Free to use' : `About Rp ${selectedSpot.price.toLocaleString('id-ID')}`}</span>
                  <button onClick={() => setShowReviewForm(true)}>Leave a review <ArrowRight size={14} /></button>
                </div>
              </div>
            </article>
          )}
          <div className="map-attribution">Map data © OpenStreetMap contributors</div>
        </div>
      </section>

      <footer className="page-footer" id="about">
        <span>Made for the journey, by the journey.</span>
        <span><span className="footer-heart">♥</span> Indonesia</span>
      </footer>

      {showAddForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowAddForm(false)
        }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="add-title">
            <div className="modal-heading">
              <div><span className="modal-kicker">HELP THE NEXT TRAVELLER</span><h2 id="add-title">Add a toilet spot</h2></div>
              <button className="icon-button" onClick={() => setShowAddForm(false)} aria-label="Close"><X size={19} /></button>
            </div>
            <form className="modal-form" onSubmit={handleAddSpot}>
              <label>Place name<input required maxLength={80} value={newSpot.name} onChange={(event) => setNewSpot({ ...newSpot, name: event.target.value })} placeholder="e.g. Ubud Market public toilet" /></label>
              <div className="form-two">
                <label>Neighbourhood<input required maxLength={80} value={newSpot.area} onChange={(event) => setNewSpot({ ...newSpot, area: event.target.value })} placeholder="e.g. Ubud" /></label>
                <label>City<input required maxLength={60} value={newSpot.city} onChange={(event) => setNewSpot({ ...newSpot, city: event.target.value })} placeholder="e.g. Gianyar" /></label>
              </div>
              <div className="form-two">
                <label>Province<input required maxLength={60} value={newSpot.province} onChange={(event) => setNewSpot({ ...newSpot, province: event.target.value })} placeholder="e.g. Bali" /></label>
                <label>Price (IDR)<input type="number" min="0" step="500" required value={newSpot.price} onChange={(event) => setNewSpot({ ...newSpot, price: event.target.value })} /></label>
              </div>
              <div className="form-two">
                <label>Latitude<input type="number" min="-11" max="6" step="any" required value={newSpot.lat} onChange={(event) => setNewSpot({ ...newSpot, lat: event.target.value })} /></label>
                <label>Longitude<input type="number" min="95" max="141" step="any" required value={newSpot.lng} onChange={(event) => setNewSpot({ ...newSpot, lng: event.target.value })} /></label>
              </div>
              <label>Amenities <span className="label-hint">(separate with commas)</span><input maxLength={100} value={newSpot.amenities} onChange={(event) => setNewSpot({ ...newSpot, amenities: event.target.value })} placeholder="Clean, Water, Accessible" /></label>
              {spotError && <p className="form-error">{spotError}</p>}
              <button className="button button-dark modal-submit" type="submit" disabled={isSubmitting}><Plus size={17} /> {isSubmitting ? 'Saving…' : 'Add to the map'}</button>
            </form>
          </section>
        </div>
      )}

      {showReviewForm && selectedSpot && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowReviewForm(false)
        }}>
          <section className="modal-card review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
            <div className="modal-heading">
              <div><span className="modal-kicker">YOUR EXPERIENCE MATTERS</span><h2 id="review-title">Review this spot</h2><p className="modal-subtitle">{selectedSpot.name} · {selectedSpot.area}</p></div>
              <button className="icon-button" onClick={() => setShowReviewForm(false)} aria-label="Close"><X size={19} /></button>
            </div>
            <form className="modal-form" onSubmit={handleAddReview}>
              <label>Your name<input required maxLength={50} value={newReview.author} onChange={(event) => setNewReview({ ...newReview, author: event.target.value })} placeholder="How should we call you?" /></label>
              <div className="rating-field">
                <span>Your rating</span>
                <div className="rating-picker" role="group" aria-label="Choose a rating">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" aria-label={`${rating} star${rating === 1 ? '' : 's'}`} aria-pressed={newReview.rating === rating} onClick={() => setNewReview({ ...newReview, rating })}>
                      <Star size={25} fill={rating <= newReview.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <label>Your review<textarea required maxLength={500} rows={4} value={newReview.text} onChange={(event) => {
                setNewReview({ ...newReview, text: event.target.value })
                setReviewError('')
              }} placeholder="What should other travellers know?" /></label>
              {reviewError && <p className="form-error">{reviewError}</p>}
              <button className="button button-dark modal-submit" type="submit" disabled={isSubmitting}><Check size={17} /> {isSubmitting ? 'Posting…' : 'Post review'}</button>
            </form>
          </section>
        </div>
      )}
      {toast && <div className="toast-message" role="status">{toast}</div>}
    </main>
  )
}

export default App
