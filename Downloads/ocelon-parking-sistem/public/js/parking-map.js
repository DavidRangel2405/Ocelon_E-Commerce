// parking-map.js
// OCELON - ParkingMap con clustering, pulso, actualizaciones incrementales y búsqueda debounced

class ParkingMap {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.mapElId = `${containerId}-map`;
        this.options = Object.assign({
            center: [21.8818, -102.2916],
            zoom: 13,
            apiEndpoint: '/api/parking-lots',
            autoUpdate: true,
            updateInterval: 30000,
            clustering: true,
            clusterOptions: { spiderfyOnMaxZoom: true, showCoverageOnHover: false }
        }, options);

        this.map = null;
        this.markers = []; // array of L.Marker
        this.markersById = new Map(); // map _id -> marker
        this.parkingData = [];
        this.clusterGroup = null;
        this.initialFitDone = false;
        this.updateInterval = null;

        this._debouncedSearch = this._debounce(this._performSearch.bind(this), 350);

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`ParkingMap: container "${this.containerId}" not found`);
            return;
        }

// build inner markup (keeps your layout intact)
        container.innerHTML = `
            <div class="oc-map-wrapper">
                <div id="${this.mapElId}" class="oc-map"></div>

                <div class="oc-map-controls">
                    <div class="oc-search">
                        <input id="mapSearchInput" placeholder="Buscar estacionamiento..." />
                        <button id="mapSearchClear" title="Limpiar búsqueda">✕</button>
                    </div>
                    <div class="oc-actions">
                        <button id="locateMeBtn" title="Centrar en mi ubicación">
                            <i class="fas fa-location-crosshairs"></i>
                            <span>Mi Ubicación</span>
                        </button>
                        <button id="toggleListBtn" title="Ver lista">
                            <i class="fas fa-list"></i>
                            <span>Ver Lista</span>
                        </button>
                    </div>
                    
                    <div class="oc-filters-title">
                        <i class="fas fa-filter"></i>
                        Filtrar por Estado
                    </div>
                    <div class="oc-filters">
                        <label>
                            <input id="filterAvailable" type="checkbox" checked />
                            <span>🟢 Disponible</span>
                        </label>
                        <label>
                            <input id="filterBusy" type="checkbox" checked />
                            <span>🟡 Casi Lleno</span>
                        </label>
                        <label>
                            <input id="filterFull" type="checkbox" checked />
                            <span>🔴 Completo</span>
                        </label>
                    </div>
                </div>

                <div id="${this.containerId}-list" class="oc-parking-list"></div>

                <div id="${this.containerId}-loading" class="oc-map-loading" style="display:none">
                    <i class="fas fa-spinner fa-spin"></i> Cargando...
                </div>
            </div>
        `;

        // hook controls
        document.getElementById('mapSearchInput').addEventListener('input', (e) => {
            this._debouncedSearch(e.target.value);
        });
        document.getElementById('mapSearchClear').addEventListener('click', () => {
            document.getElementById('mapSearchInput').value = '';
            this._debouncedSearch('');
        });
        document.getElementById('locateMeBtn').addEventListener('click', () => this.locateMe());
        document.getElementById('toggleListBtn').addEventListener('click', () => {
            document.getElementById(`${this.containerId}-list`).classList.toggle('active');
        });
        ['filterAvailable','filterBusy','filterFull'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this._applyFiltersAndRender());
        });

        // init leaflet map
        this.map = L.map(this.mapElId, { zoomControl: true }).setView(this.options.center, this.options.zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // clustering
        if (this.options.clustering && typeof L.markerClusterGroup === 'function') {
            this.clusterGroup = L.markerClusterGroup(this.options.clusterOptions);
            this.map.addLayer(this.clusterGroup);
        }

        // load data
        this._showLoading(true);
        this.loadParkingData().then(() => {
            this._showLoading(false);

            // auto update
            if (this.options.autoUpdate) {
                this.updateInterval = setInterval(() => {
                    this.loadParkingData(true); // incremental
                }, this.options.updateInterval);
            }
        });
    }

    // ========================================
    // MÉTODOS PÚBLICOS
    // ========================================

    async loadParkingData(incremental = false) {
        try {
            const response = await fetch(this.options.apiEndpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al cargar estacionamientos');
            }

            const newData = data.parkingLots || [];

            if (incremental) {
                this._updateMarkersIncrementally(newData);
            } else {
                this.parkingData = newData;
                this._renderMarkers();
                this._renderList();
            }

            this.parkingData = newData;

            // fit bounds una sola vez
            if (!this.initialFitDone && newData.length > 0) {
                const group = new L.featureGroup(this.markers);
                this.map.fitBounds(group.getBounds().pad(0.1));
                this.initialFitDone = true;
            }

        } catch (error) {
            console.error('Error loading parking data:', error);
            this._showError('Error al cargar los datos de estacionamientos');
        }
    }

    locateMe() {
        if (!navigator.geolocation) {
            this._showError('Geolocalización no soportada');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                this.map.setView([latitude, longitude], 16);

                if (this.userLocationMarker) {
                    this.map.removeLayer(this.userLocationMarker);
                }

                this.userLocationMarker = L.circleMarker([latitude, longitude], {
                    radius: 8,
                    color: '#2563eb',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.8
                }).addTo(this.map);
            },
            () => {
                this._showError('No se pudo obtener tu ubicación');
            }
        );
    }

    // ========================================
    // RENDERIZADO
    // ========================================

    _renderMarkers() {
        // clear existing
        this._clearMarkers();

        this.parkingData.forEach(lot => {
            if (!lot.latitude || !lot.longitude) return;

            const marker = this._createMarker(lot);
            
            // IMPORTANTE: Agregar lotId al marker para búsqueda
            marker.lotId = lot._id;
            marker.lotData = lot; // Guardar datos completos
            
            this.markers.push(marker);
            this.markersById.set(lot._id, marker);

            if (this.clusterGroup) {
                this.clusterGroup.addLayer(marker);
            } else {
                marker.addTo(this.map);
            }
        });
    }

    _createMarker(lot) {
        const status = this._getParkingStatus(lot);
        const color = this._getStatusColor(status);
        const pulsing = status === 'available';

        // HTML para el icono personalizado
        const iconHtml = `
            <div class="custom-marker ${pulsing ? 'pulsing' : ''}" style="background-color: ${color};">
                <i class="fas fa-parking"></i>
                <div class="marker-info">
                    <div class="spots">${lot.occupiedSpots}/${lot.totalSpots}</div>
                </div>
            </div>
        `;

        const icon = L.divIcon({
            html: iconHtml,
            className: 'custom-div-icon',
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        const marker = L.marker([lot.latitude, lot.longitude], { icon });

        // Popup con información detallada
        const popupContent = this._createPopupContent(lot, status);
        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup'
        });

        // Evento click para seleccionar estacionamiento
        marker.on('click', () => {
            this._handleMarkerClick(lot);
        });

        return marker;
    }

    _createPopupContent(lot, status) {
        const availabilityText = this._getAvailabilityText(status);
        const statusColor = this._getStatusColor(status);
        
        return `
            <div class="parking-popup">
                <div class="popup-header">
                    <h6>${lot.name}</h6>
                    <span class="status-badge" style="background-color: ${statusColor}">
                        ${availabilityText}
                    </span>
                </div>
                <div class="popup-body">
                    <p class="address">
                        <i class="fas fa-map-marker-alt"></i>
                        ${lot.address}
                    </p>
                    <div class="parking-details">
                        <div class="detail-item">
                            <i class="fas fa-car"></i>
                            <span>Capacidad: ${lot.occupiedSpots}/${lot.totalSpots}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-dollar-sign"></i>
                            <span>Tarifa: $${lot.hourlyRate}/hora</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>Horario: ${lot.openTime} - ${lot.closeTime}</span>
                        </div>
                    </div>
                    ${lot.amenidades && lot.amenidades.length > 0 ? `
                        <div class="amenidades">
                            <small><strong>Amenidades:</strong> ${lot.amenidades.join(', ')}</small>
                        </div>
                    ` : ''}
                </div>
                <div class="popup-actions">
                    <button class="btn-park" onclick="window.selectParkingLotFromMap('${lot._id}')">
                        <i class="fas fa-play"></i>
                        Estacionar Aquí
                    </button>
                </div>
            </div>
        `;
    }

    _renderList() {
        const listContainer = document.getElementById(`${this.containerId}-list`);
        if (!listContainer) return;

        listContainer.innerHTML = `
            <div class="parking-list-header">
                <h5>Estacionamientos (${this.parkingData.length})</h5>
                <button class="close-list" onclick="document.getElementById('${this.containerId}-list').classList.remove('active')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="parking-list-items">
                ${this.parkingData.map(lot => `
                    <div class="parking-list-item" onclick="window.selectParkingLotFromMap('${lot._id}')">
                        <div class="item-info">
                            <h6>${lot.name}</h6>
                            <p class="address">${lot.address}</p>
                            <div class="item-details">
                                <span class="capacity">${lot.occupiedSpots}/${lot.totalSpots} ocupados</span>
                                <span class="rate">$${lot.hourlyRate}/hora</span>
                            </div>
                        </div>
                        <div class="item-status">
                            <span class="status-indicator ${this._getParkingStatus(lot)}"></span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ========================================
    // UTILIDADES
    // ========================================

    _getParkingStatus(lot) {
        const occupancyRate = lot.occupiedSpots / lot.totalSpots;
        if (occupancyRate >= 1) return 'full';
        if (occupancyRate >= 0.8) return 'busy';
        return 'available';
    }

    _getStatusColor(status) {
        const colors = {
            'available': '#059669', // verde
            'busy': '#d97706',      // amarillo
            'full': '#dc2626'       // rojo
        };
        return colors[status] || '#6b7280';
    }

    _getAvailabilityText(status) {
        const texts = {
            'available': 'Disponible',
            'busy': 'Casi lleno',
            'full': 'Completo'
        };
        return texts[status] || 'Desconocido';
    }

    _applyFiltersAndRender() {
        const filters = {
            available: document.getElementById('filterAvailable').checked,
            busy: document.getElementById('filterBusy').checked,
            full: document.getElementById('filterFull').checked
        };

        this.markers.forEach(marker => {
            // Usar lotData que guardamos en el marker
            const lot = marker.lotData;
            if (!lot) return;

            const status = this._getParkingStatus(lot);
            const shouldShow = filters[status];

            if (this.clusterGroup) {
                if (shouldShow) {
                    this.clusterGroup.addLayer(marker);
                } else {
                    this.clusterGroup.removeLayer(marker);
                }
            } else {
                if (shouldShow && !this.map.hasLayer(marker)) {
                    marker.addTo(this.map);
                } else if (!shouldShow && this.map.hasLayer(marker)) {
                    this.map.removeLayer(marker);
                }
            }
        });
    }

    _performSearch(query) {
        console.log('Buscando:', query);
        
        if (!query.trim()) {
            // Si no hay búsqueda, aplicar solo los filtros
            this._applyFiltersAndRender();
            return;
        }

        const searchTerm = query.toLowerCase();
        
        // Obtener filtros actuales
        const filters = {
            available: document.getElementById('filterAvailable').checked,
            busy: document.getElementById('filterBusy').checked,
            full: document.getElementById('filterFull').checked
        };
        
        this.markers.forEach(marker => {
            // Usar lotData que guardamos en el marker
            const lot = marker.lotData;
            if (!lot) return;

            const matchesSearch = lot.name.toLowerCase().includes(searchTerm) ||
                                lot.address.toLowerCase().includes(searchTerm);

            // Aplicar tanto búsqueda como filtros
            const status = this._getParkingStatus(lot);
            const matchesFilter = filters[status];
            const shouldShow = matchesSearch && matchesFilter;

            if (this.clusterGroup) {
                if (shouldShow) {
                    this.clusterGroup.addLayer(marker);
                } else {
                    this.clusterGroup.removeLayer(marker);
                }
            } else {
                if (shouldShow && !this.map.hasLayer(marker)) {
                    marker.addTo(this.map);
                } else if (!shouldShow && this.map.hasLayer(marker)) {
                    this.map.removeLayer(marker);
                }
            }
        });
    }

    _debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    _clearMarkers() {
        if (this.clusterGroup) {
            this.clusterGroup.clearLayers();
        } else {
            this.markers.forEach(marker => {
                if (this.map.hasLayer(marker)) {
                    this.map.removeLayer(marker);
                }
            });
        }
        this.markers = [];
        this.markersById.clear();
    }

    _updateMarkersIncrementally(newData) {
        // Actualización incremental para no recargar todo
        newData.forEach(newLot => {
            const existingMarker = this.markersById.get(newLot._id);
            if (existingMarker) {
                // Actualizar datos existentes
                existingMarker.lotData = newLot;
                
                // Actualizar el popup si está abierto
                if (existingMarker.getPopup()) {
                    const status = this._getParkingStatus(newLot);
                    const popupContent = this._createPopupContent(newLot, status);
                    existingMarker.setPopupContent(popupContent);
                }
            } else {
                // Agregar nuevo marcador
                if (newLot.latitude && newLot.longitude) {
                    const marker = this._createMarker(newLot);
                    marker.lotId = newLot._id;
                    marker.lotData = newLot;
                    
                    this.markers.push(marker);
                    this.markersById.set(newLot._id, marker);

                    if (this.clusterGroup) {
                        this.clusterGroup.addLayer(marker);
                    } else {
                        marker.addTo(this.map);
                    }
                }
            }
        });
    }

    _showLoading(show) {
        const loading = document.getElementById(`${this.containerId}-loading`);
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    _showError(message) {
        console.error('ParkingMap Error:', message);
        if (window.showToast) {
            window.showToast.error('Error', message);
        }
    }

    _handleMarkerClick(lot) {
        // Llamar a la función global para manejar el click
        if (typeof this.onMarkerClick === 'function') {
            this.onMarkerClick(lot);
        }
    }

    // ========================================
    // DESTRUCCIÓN
    // ========================================

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this._clearMarkers();
        
        if (this.map) {
            this.map.remove();
        }
    }
}

// ========================================
// FUNCIONES GLOBALES PARA LOS POPUPS
// ========================================

// Función global para seleccionar estacionamiento desde el mapa
window.selectParkingLotFromMap = function(lotId) {
    console.log('Seleccionando estacionamiento:', lotId);
    
    // Buscar el estacionamiento en los datos del mapa
    if (window.parkingMapInstance && window.parkingMapInstance.parkingData) {
        const lot = window.parkingMapInstance.parkingData.find(l => l._id === lotId);
        
        if (lot) {
            console.log('Estacionamiento encontrado:', lot);
            
            // Llamar a la función del dashboard para abrir el modal
            if (typeof window.openNewSessionModalWithParking === 'function') {
                window.openNewSessionModalWithParking(lotId);
            } else {
                console.error('Función openNewSessionModalWithParking no encontrada');
            }
        } else {
            console.error('Estacionamiento no encontrado en los datos');
        }
    } else {
        console.error('parkingMapInstance no disponible');
    }
};

// Hacer la clase disponible globalmente
window.ParkingMap = ParkingMap;

// Hacer la clase disponible globalmente
window.ParkingMap = ParkingMap;