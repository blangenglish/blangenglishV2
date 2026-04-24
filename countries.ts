// Country and city data for Latin America + Spain
export interface CountryData {
  code: string;
  name: string;
  flag: string;
  cities: string[];
}

export const COUNTRIES: CountryData[] = [
  {
    code: 'CO', name: 'Colombia', flag: '🇨🇴',
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Cúcuta', 'Ibagué', 'Armenia', 'Villavicencio', 'Pasto', 'Neiva', 'Montería', 'Sincelejo', 'Popayán', 'Valledupar', 'Otra ciudad'],
  },
  {
    code: 'MX', name: 'México', flag: '🇲🇽',
    cities: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Mérida', 'Cancún', 'San Luis Potosí', 'Aguascalientes', 'Hermosillo', 'Querétaro', 'Morelia', 'Chihuahua', 'Otra ciudad'],
  },
  {
    code: 'VE', name: 'Venezuela', flag: '🇻🇪',
    cities: ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'Maturín', 'Barcelona', 'Mérida', 'Cumaná', 'Otra ciudad'],
  },
  {
    code: 'AR', name: 'Argentina', flag: '🇦🇷',
    cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'San Juan', 'Salta', 'Santa Fe', 'Tucumán', 'Otra ciudad'],
  },
  {
    code: 'PE', name: 'Perú', flag: '🇵🇪',
    cities: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Piura', 'Iquitos', 'Cusco', 'Huancayo', 'Tacna', 'Otra ciudad'],
  },
  {
    code: 'CL', name: 'Chile', flag: '🇨🇱',
    cities: ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Arica', 'Otra ciudad'],
  },
  {
    code: 'EC', name: 'Ecuador', flag: '🇪🇨',
    cities: ['Guayaquil', 'Quito', 'Cuenca', 'Santo Domingo', 'Machala', 'Durán', 'Manta', 'Loja', 'Ambato', 'Otra ciudad'],
  },
  {
    code: 'BO', name: 'Bolivia', flag: '🇧🇴',
    cities: ['La Paz', 'Santa Cruz de la Sierra', 'Cochabamba', 'Sucre', 'Oruro', 'Potosí', 'Tarija', 'Otra ciudad'],
  },
  {
    code: 'PY', name: 'Paraguay', flag: '🇵🇾',
    cities: ['Asunción', 'Ciudad del Este', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré', 'Otra ciudad'],
  },
  {
    code: 'UY', name: 'Uruguay', flag: '🇺🇾',
    cities: ['Montevideo', 'Salto', 'Ciudad de la Costa', 'Paysandú', 'Las Piedras', 'Rivera', 'Otra ciudad'],
  },
  {
    code: 'PA', name: 'Panamá', flag: '🇵🇦',
    cities: ['Ciudad de Panamá', 'San Miguelito', 'Tocumen', 'David', 'Colón', 'Otra ciudad'],
  },
  {
    code: 'CR', name: 'Costa Rica', flag: '🇨🇷',
    cities: ['San José', 'Alajuela', 'Desamparados', 'Pérez Zeledón', 'San Carlos', 'Otra ciudad'],
  },
  {
    code: 'GT', name: 'Guatemala', flag: '🇬🇹',
    cities: ['Ciudad de Guatemala', 'Mixco', 'Villa Nueva', 'Petapa', 'San Juan Sacatepéquez', 'Otra ciudad'],
  },
  {
    code: 'HN', name: 'Honduras', flag: '🇭🇳',
    cities: ['Tegucigalpa', 'San Pedro Sula', 'La Ceiba', 'Choloma', 'El Progreso', 'Otra ciudad'],
  },
  {
    code: 'SV', name: 'El Salvador', flag: '🇸🇻',
    cities: ['San Salvador', 'Soyapango', 'Santa Ana', 'San Miguel', 'Mejicanos', 'Otra ciudad'],
  },
  {
    code: 'NI', name: 'Nicaragua', flag: '🇳🇮',
    cities: ['Managua', 'León', 'Masaya', 'Matagalpa', 'Chinandega', 'Otra ciudad'],
  },
  {
    code: 'DO', name: 'República Dominicana', flag: '🇩🇴',
    cities: ['Santo Domingo', 'Santiago', 'La Romana', 'San Pedro de Macorís', 'La Vega', 'Otra ciudad'],
  },
  {
    code: 'CU', name: 'Cuba', flag: '🇨🇺',
    cities: ['La Habana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Guantánamo', 'Otra ciudad'],
  },
  {
    code: 'ES', name: 'España', flag: '🇪🇸',
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Bilbao', 'Murcia', 'Otra ciudad'],
  },
  {
    code: 'US', name: 'Estados Unidos', flag: '🇺🇸',
    cities: ['Miami', 'Nueva York', 'Los Ángeles', 'Houston', 'Chicago', 'Dallas', 'Orlando', 'San Antonio', 'Otra ciudad'],
  },
  {
    code: 'OTHER', name: 'Otro país', flag: '🌍',
    cities: ['Otra ciudad'],
  },
];
