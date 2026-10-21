export interface DepartamentoColombia {
  departamento: string;
  municipios: string[];
}

export interface ClientContact {
  celular: string;
  correo: string;
}

export interface ClientLicense {
  sistema: 'ContaPyme' | 'AgroWin' | string;
  numero_licencia: string;
  codigo_producto: string;
  vencimiento: string | null;
  permanente: boolean;
  // Campos legados para retrocompatibilidad
  codigo?: string;
  nombre?: string;
}

export const SISTEMAS_LICENCIA = ['ContaPyme', 'AgroWin'] as const;
export const PROVEEDORES_BOLSA = ['Cadena', 'Insoft'] as const;
export const PAQUETES_DOCUMENTOS = ['50', '120', '300', '600', '1500', '3000', '6000', '12000'] as const;

export function findDepartamentoByMunicipio(municipioInput?: string | null): { departamento: string; municipio: string } | null {
  if (!municipioInput) return null;
  const normalized = municipioInput.trim().toLowerCase();
  for (const item of COLOMBIA_DEPARTAMENTOS) {
    const found = item.municipios.find(m => m.toLowerCase() === normalized);
    if (found) {
      return { departamento: item.departamento, municipio: found };
    }
  }
  return null;
}

export function normalizeClientRecord(raw: any) {
  let meta: any = {};
  if (raw?.codigo_comercial_licencia && typeof raw.codigo_comercial_licencia === 'string' && raw.codigo_comercial_licencia.trim().startsWith('{')) {
    try {
      meta = JSON.parse(raw.codigo_comercial_licencia);
    } catch {
      meta = {};
    }
  }

  // Departamento y municipio
  let departamento = raw?.departamento || meta.departamento || '';
  let municipio = raw?.municipio || meta.municipio || '';

  if (!departamento && raw?.pais && raw.pais !== 'Colombia') {
    const deptMatch = COLOMBIA_DEPARTAMENTOS.find(d => d.departamento.toLowerCase() === raw.pais.trim().toLowerCase());
    if (deptMatch) departamento = deptMatch.departamento;
  }

  if (!municipio && raw?.ciudad) {
    const matched = findDepartamentoByMunicipio(raw.ciudad);
    if (matched) {
      if (!departamento) departamento = matched.departamento;
      municipio = matched.municipio;
    } else {
      municipio = raw.ciudad;
    }
  }

  // Contactos
  let contactos: ClientContact[] = [];
  if (Array.isArray(raw?.contactos) && raw.contactos.length > 0) {
    contactos = raw.contactos.map((c: any) => ({
      celular: c.celular || '',
      correo: c.correo || ''
    }));
  } else if (Array.isArray(meta?.contactos) && meta.contactos.length > 0) {
    contactos = meta.contactos.map((c: any) => ({
      celular: c.celular || '',
      correo: c.correo || ''
    }));
  } else if (raw?.celular || raw?.correo || meta?.correo) {
    contactos = [{
      celular: raw?.celular || '',
      correo: raw?.correo || meta?.correo || ''
    }];
  }

  if (contactos.length === 0) {
    contactos = [{ celular: '', correo: '' }];
  }

  // Licencias
  const rawLicencias = Array.isArray(raw?.licencias) ? raw.licencias : [];
  const licencias: ClientLicense[] = rawLicencias.map((lic: any) => {
    const sistema = lic.sistema || (lic.nombre === 'ContaPyme' || lic.nombre === 'AgroWin' ? lic.nombre : 'ContaPyme');
    const numero_licencia = lic.numero_licencia ?? lic.codigo ?? '';
    const codigo_producto = lic.codigo_producto ?? (lic.nombre && lic.nombre !== 'ContaPyme' && lic.nombre !== 'AgroWin' ? lic.nombre : '');
    const permanente = typeof lic.permanente === 'boolean' ? lic.permanente : !lic.vencimiento;
    const vencimiento = permanente ? null : (lic.vencimiento || null);

    return {
      sistema,
      numero_licencia,
      codigo_producto,
      vencimiento,
      permanente,
      codigo: numero_licencia,
      nombre: sistema
    };
  });

  // Bolsas de documentos
  let proveedor_bolsa = raw?.proveedor_bolsa ?? meta?.proveedor_bolsa ?? '';
  let doc_integrales = raw?.doc_integrales ?? meta?.doc_integrales ?? '';
  let eventos_bolsa = raw?.eventos_bolsa ?? meta?.eventos_bolsa ?? '';

  if (!proveedor_bolsa && !doc_integrales && raw?.codigo_comercial_docs) {
    if (String(raw.codigo_comercial_docs).includes(':')) {
      const [prov, docs] = String(raw.codigo_comercial_docs).split(':');
      proveedor_bolsa = prov || '';
      doc_integrales = docs || '';
    } else if (PAQUETES_DOCUMENTOS.includes(raw.codigo_comercial_docs as any)) {
      doc_integrales = raw.codigo_comercial_docs;
    }
  }

  if (!eventos_bolsa && raw?.codigo_comercial_eventos && PAQUETES_DOCUMENTOS.includes(raw.codigo_comercial_eventos as any)) {
    eventos_bolsa = raw.codigo_comercial_eventos;
  }

  if (proveedor_bolsa === 'Insoft') {
    eventos_bolsa = '';
  }

  return {
    ...raw,
    departamento,
    municipio,
    correo: contactos[0]?.correo || raw?.correo || '',
    celular: contactos[0]?.celular || raw?.celular || '',
    contactos,
    licencias,
    proveedor_bolsa,
    doc_integrales,
    eventos_bolsa,
    vencimiento_eventos: proveedor_bolsa === 'Insoft' ? null : (raw?.vencimiento_eventos || null)
  };
}

export const COLOMBIA_DEPARTAMENTOS: DepartamentoColombia[] = [
  {
    departamento: 'Amazonas',
    municipios: [
      'Leticia',
      'El Encanto',
      'La Chorrera',
      'La Pedrera',
      'La Victoria',
      'Mirití - Paraná',
      'Puerto Alegría',
      'Puerto Arica',
      'Puerto Nariño',
      'Puerto Santander',
      'Tarapacá'
    ]
  },
  {
    departamento: 'Antioquia',
    municipios: [
      'Abejorral', 'Abriaquí', 'Alejandría', 'Amagá', 'Amalfi', 'Andes', 'Angelópolis', 'Angostura',
      'Anorí', 'Anzá', 'Apartadó', 'Arboletes', 'Argelia', 'Armenia', 'Barbosa', 'Bello', 'Belmira',
      'Betania', 'Betulia', 'Briceño', 'Buriticá', 'Cáceres', 'Caicedo', 'Caldas', 'Campamento',
      'Cañasgordas', 'Caracolí', 'Caramanta', 'Carepa', 'Carolina del Príncipe', 'Caucasia',
      'Chigorodó', 'Cisneros', 'Ciudad Bolívar', 'Cocorná', 'Concepción', 'Concordia', 'Copacabana',
      'Dabeiba', 'Donmatías', 'Ebéjico', 'El Bagre', 'El Carmen de Viboral', 'El Peñol', 'El Retiro',
      'El Santuario', 'Entrerríos', 'Envigado', 'Fredonia', 'Frontino', 'Giraldo', 'Girardota',
      'Gómez Plata', 'Granada', 'Guadalupe', 'Guarne', 'Guatapé', 'Heliconia', 'Hispania', 'Itagüí',
      'Ituango', 'Jardín', 'Jericó', 'La Ceja', 'La Estrella', 'La Pintada', 'La Unión', 'Liborina',
      'Maceo', 'Marinilla', 'Medellín', 'Montebello', 'Murindó', 'Mutatá', 'Nariño', 'Nechí',
      'Necoclí', 'Olaya', 'Peque', 'Pueblorrico', 'Puerto Berrío', 'Puerto Nare', 'Puerto Triunfo',
      'Remedios', 'Rionegro', 'Sabanalarga', 'Sabaneta', 'Salgar', 'San Andrés de Cuerquia',
      'San Carlos', 'San Francisco', 'San Jerónimo', 'San José de la Montaña', 'San Juan de Urabá',
      'San Luis', 'San Pedro de los Milagros', 'San Pedro de Urabá', 'San Rafael', 'San Roque',
      'San Vicente Ferrer', 'Santa Bárbara', 'Santa Fe de Antioquia', 'Santa Rosa de Osos',
      'Santo Domingo', 'Segovia', 'Sonsón', 'Sopetrán', 'Támesis', 'Tarazá', 'Tarso', 'Titiribí',
      'Toledo', 'Turbo', 'Uramita', 'Urrao', 'Valdivia', 'Valparaíso', 'Vegachí', 'Venecia',
      'Vigía del Fuerte', 'Yalí', 'Yarumal', 'Yolombó', 'Yondó', 'Zaragoza'
    ]
  },
  {
    departamento: 'Arauca',
    municipios: [
      'Arauca', 'Arauquita', 'Cravo Norte', 'Fortul', 'Puerto Rondón', 'Saravena', 'Tame'
    ]
  },
  {
    departamento: 'Archipiélago de San Andrés, Providencia y Santa Catalina',
    municipios: [
      'San Andrés', 'Providencia y Santa Catalina Islas'
    ]
  },
  {
    departamento: 'Atlántico',
    municipios: [
      'Baranoa', 'Barranquilla', 'Campo de la Cruz', 'Candelaria', 'Galapa', 'Juan de Acosta',
      'Luruaco', 'Malambo', 'Manatí', 'Palmar de Varela', 'Piojó', 'Polonuevo', 'Ponedera',
      'Puerto Colombia', 'Repelón', 'Sabanagrande', 'Sabanalarga', 'Santa Lucía', 'Santo Tomás',
      'Soledad', 'Suán', 'Tubará', 'Usiacurí'
    ]
  },
  {
    departamento: 'Bolívar',
    municipios: [
      'Achí', 'Altos del Rosario', 'Arenal', 'Arjona', 'Arroyohondo', 'Barranco de Loba',
      'Calamar', 'Cantagallo', 'Cartagena de Indias', 'Cicuco', 'Clemencia', 'Córdoba',
      'El Carmen de Bolívar', 'El Guamo', 'El Peñón', 'Hatillo de Loba', 'Magangué', 'Mahates',
      'Margarita', 'María la Baja', 'Mompós', 'Montecristo', 'Morales', 'Norosí', 'Pinillos',
      'Regidor', 'Río Viejo', 'San Cristóbal', 'San Estanislao', 'San Fernando', 'San Jacinto',
      'San Jacinto del Cauca', 'San Juan Nepomuceno', 'San Martín de Loba', 'San Pablo',
      'Santa Catalina', 'Santa Rosa', 'Santa Rosa del Sur', 'Simití', 'Soplaviento',
      'Talaigua Nuevo', 'Tiquisio', 'Turbaco', 'Turbaná', 'Villanueva', 'Zambrano'
    ]
  },
  {
    departamento: 'Boyacá',
    municipios: [
      'Almeida', 'Aquitania', 'Arcabuco', 'Belén', 'Berbeo', 'Betéitiva', 'Boavita', 'Boyacá',
      'Briceño', 'Buenavista', 'Busbanzá', 'Caldas', 'Campohermoso', 'Cerinza', 'Chinavita',
      'Chiquinquirá', 'Chíquiza', 'Chiscas', 'Chita', 'Chitaraque', 'Chivatá', 'Chivor', 'Ciénega',
      'Cómbita', 'Coper', 'Corrales', 'Covarachía', 'Cubará', 'Cucaita', 'Cuítiva', 'Duitama',
      'El Cocuy', 'El Espino', 'Firavitoba', 'Floresta', 'Gachantivá', 'Gámeza', 'Garagoa',
      'Guacamayas', 'Guateque', 'Guayatá', 'Güicán de la Sierra', 'Iza', 'Jenesano', 'Jericó',
      'La Capilla', 'La Uvita', 'La Victoria', 'Labranzagrande', 'Macanal', 'Maripí', 'Miraflores',
      'Mongua', 'Monguí', 'Moniquirá', 'Motavita', 'Muzo', 'Nobsa', 'Nuevo Colón', 'Oicatá',
      'Otanche', 'Pachavita', 'Páez', 'Paipa', 'Pajarito', 'Panqueba', 'Pauna', 'Paya', 'Paz de Río',
      'Pesca', 'Pisba', 'Puerto Boyacá', 'Quípama', 'Ramiriquí', 'Ráquira', 'Rondón', 'Saboyá',
      'Sáchica', 'Samacá', 'San Eduardo', 'San José de Pare', 'San Luis de Gaceno', 'San Mateo',
      'San Miguel de Sema', 'San Pablo de Borbur', 'Santa María', 'Santa Rosa de Viterbo',
      'Santa Sofía', 'Santana', 'Sativanorte', 'Sativasur', 'Siachoque', 'Soatá', 'Socha',
      'Socotá', 'Sogamoso', 'Somondoco', 'Sora', 'Soracá', 'Sotaquirá', 'Susacón', 'Sutamarchán',
      'Sutatenza', 'Tasco', 'Tenza', 'Tibaná', 'Tibasosa', 'Tinjacá', 'Tipacoque', 'Toca', 'Togüí',
      'Tópaga', 'Tota', 'Tunja', 'Tununguá', 'Turmequé', 'Tuta', 'Tutazá', 'Úmbita', 'Ventaquemada',
      'Villa de Leyva', 'Viracachá', 'Zetaquira'
    ]
  },
  {
    departamento: 'Caldas',
    municipios: [
      'Aguadas', 'Anserma', 'Aranzazu', 'Belalcázar', 'Chinchiná', 'Filadelfia', 'La Dorada',
      'La Merced', 'Manizales', 'Manzanares', 'Marmato', 'Marquetalia', 'Marulanda', 'Neira',
      'Norcasia', 'Pácora', 'Palestina', 'Pensilvania', 'Riosucio', 'Risaralda', 'Salamina',
      'Samaná', 'San José', 'Supía', 'Victoria', 'Villamaría', 'Viterbo'
    ]
  },
  {
    departamento: 'Caquetá',
    municipios: [
      'Albania', 'Belén de los Andaquíes', 'Cartagena del Chairá', 'Curillo', 'El Doncello',
      'El Paujíl', 'Florencia', 'La Montañita', 'Milán', 'Morelia', 'Puerto Rico',
      'San José del Fragua', 'San Vicente del Caguán', 'Solano', 'Solita', 'Valparaíso'
    ]
  },
  {
    departamento: 'Casanare',
    municipios: [
      'Aguazul', 'Chámeza', 'Hato Corozal', 'La Salina', 'Maní', 'Monterrey', 'Nunchía',
      'Orocué', 'Paz de Ariporo', 'Pore', 'Recetor', 'Sabanalarga', 'Sácama', 'San Luis de Palenque',
      'Támara', 'Tauramena', 'Trinidad', 'Villanueva', 'Yopal'
    ]
  },
  {
    departamento: 'Cauca',
    municipios: [
      'Almaguer', 'Argelia', 'Balboa', 'Bolívar', 'Buenos Aires', 'Cajibío', 'Caldono', 'Caloto',
      'Corinto', 'El Tambo', 'Florencia', 'Guachené', 'Guapí', 'Inzá', 'Jambaló', 'La Sierra',
      'La Vega', 'López de Micay', 'Mercaderes', 'Miranda', 'Morales', 'Padilla', 'Páez',
      'Patía', 'Piamonte', 'Piendamó', 'Popayán', 'Puerto Tejada', 'Puracé', 'Rosas',
      'San Sebastián', 'Santa Rosa', 'Santander de Quilichao', 'Silvia', 'Sotará', 'Suárez',
      'Sucre', 'Timbío', 'Timbiquí', 'Toribío', 'Totoró', 'Villa Rica'
    ]
  },
  {
    departamento: 'Cesar',
    municipios: [
      'Aguachica', 'Astrea', 'Becerril', 'Bosconia', 'Chimichagua', 'Chiriguaná', 'Codazzi',
      'Curumaní', 'El Copey', 'El Paso', 'Gamarra', 'González', 'La Gloria', 'La Jagua de Ibirico',
      'La Paz', 'Manaure Balcón del Cesar', 'Pailitas', 'Pelaya', 'Pueblo Bello', 'Río de Oro',
      'San Alberto', 'San Diego', 'San Martín', 'Tamalameque', 'Valledupar'
    ]
  },
  {
    departamento: 'Chocó',
    municipios: [
      'Acandí', 'Alto Baudó', 'Atrato', 'Bagadó', 'Bahía Solano', 'Bajo Baudó', 'Bojayá',
      'Cantón de San Pablo', 'Carmen del Darién', 'Cértegui', 'Condoto', 'El Carmen de Atrato',
      'El Litoral del San Juan', 'Istmina', 'Juradó', 'Lloró', 'Medio Atrato', 'Medio Baudó',
      'Medio San Juan', 'Nóvita', 'Nuquí', 'Quibdó', 'Río Iró', 'Río Quito', 'Riosucio',
      'San José del Palmar', 'Sipí', 'Tadó', 'Unguía', 'Unión Panamericana'
    ]
  },
  {
    departamento: 'Córdoba',
    municipios: [
      'Ayapel', 'Buenavista', 'Canalete', 'Cereté', 'Chimá', 'Chinú', 'Ciénaga de Oro',
      'Cotorra', 'La Apartada', 'Lorica', 'Los Córdobas', 'Momil', 'Montelíbano', 'Montería',
      'Moñitos', 'Planeta Rica', 'Pueblo Nuevo', 'Puerto Escondido', 'Puerto Libertador',
      'Purísima de la Concepción', 'Sahagún', 'San Andrés de Sotavento', 'San Antero',
      'San Bernardo del Viento', 'San Carlos', 'San José de Uré', 'San Pelayo', 'Tierralta',
      'Tuchín', 'Valencia'
    ]
  },
  {
    departamento: 'Cundinamarca',
    municipios: [
      'Agua de Dios', 'Albán', 'Anapoima', 'Anolaima', 'Apulo', 'Arbeláez', 'Beltrán', 'Bituima',
      'Bogotá D.C.', 'Bojacá', 'Cabrera', 'Cachipay', 'Cajicá', 'Caparrapí', 'Cáqueza',
      'Carmen de Carupa', 'Chaguaní', 'Chía', 'Chipaque', 'Choachí', 'Chocontá', 'Cogua', 'Cota',
      'Cucunubá', 'El Colegio', 'El Peñón', 'El Rosal', 'Facatativá', 'Fómeque', 'Fosca', 'Funza',
      'Fúquene', 'Fusagasugá', 'Gachalá', 'Gachancipá', 'Gachetá', 'Gama', 'Girardot', 'Granada',
      'Guachetá', 'Guaduas', 'Guasca', 'Guataquí', 'Guatavita', 'Guayabal de Síquima', 'Guayabetal',
      'Gutiérrez', 'Jerusalén', 'Junín', 'La Calera', 'La Mesa', 'La Palma', 'La Peña', 'La Vega',
      'Lenguazaque', 'Machetá', 'Madrid', 'Manta', 'Medina', 'Mosquera', 'Nariño', 'Nemocón',
      'Nilo', 'Nimaima', 'Nocaima', 'Pacho', 'Paime', 'Pandi', 'Paratebueno', 'Pasca',
      'Puerto Salgar', 'Pulí', 'Quebradanegra', 'Quetame', 'Quipile', 'Ricaurte',
      'San Antonio del Tequendama', 'San Bernardo', 'San Cayetano', 'San Francisco',
      'San Juan de Rioseco', 'Sasaima', 'Sesquilé', 'Sibaté', 'Silvania', 'Simijaca', 'Soacha',
      'Sopó', 'Subachoque', 'Suesca', 'Supatá', 'Susa', 'Sutatausa', 'Tabio', 'Tausa', 'Tena',
      'Tenjo', 'Tibacuy', 'Tibirita', 'Tocaima', 'Tocancipá', 'Topaipí', 'Ubalá', 'Ubaque',
      'Ubaté', 'Une', 'Útica', 'Venecia', 'Vergara', 'Vianí', 'Villagómez', 'Villapinzón',
      'Villeta', 'Viotá', 'Yacopí', 'Zipacón', 'Zipaquirá'
    ]
  },
  {
    departamento: 'Guainía',
    municipios: [
      'Inírida', 'Barrancominas', 'Cacahual', 'La Guadalupe', 'Morichal', 'Pana Pana',
      'Puerto Colombia', 'San Felipe'
    ]
  },
  {
    departamento: 'Guaviare',
    municipios: [
      'Calamar', 'El Retorno', 'Miraflores', 'San José del Guaviare'
    ]
  },
  {
    departamento: 'Huila',
    municipios: [
      'Acevedo', 'Agrado', 'Aipe', 'Algeciras', 'Altamira', 'Baraya', 'Campoalegre', 'Colombia',
      'Elías', 'Garzón', 'Gigante', 'Guadalupe', 'Hobo', 'Íquira', 'Isnos', 'La Argentina',
      'La Plata', 'Nátaga', 'Neiva', 'Oporapa', 'Paicol', 'Palermo', 'Palestina', 'Pital',
      'Pitalito', 'Rivera', 'Saladoblanco', 'San Agustín', 'Santa María', 'Suaza', 'Tarqui',
      'Tello', 'Teruel', 'Tesalia', 'Timaná', 'Villavieja', 'Yaguará'
    ]
  },
  {
    departamento: 'La Guajira',
    municipios: [
      'Albania', 'Barrancas', 'Dibulla', 'Distracción', 'El Molino', 'Fonseca', 'Hatonuevo',
      'La Jagua del Pilar', 'Maicao', 'Manaure', 'Riohacha', 'San Juan del Cesar', 'Uribia',
      'Urumita', 'Villanueva'
    ]
  },
  {
    departamento: 'Magdalena',
    municipios: [
      'Algarrobo', 'Aracataca', 'Ariguaní', 'Cerro de San Antonio', 'Chibolo', 'Ciénaga',
      'Concordia', 'El Banco', 'El Piñón', 'El Retén', 'Fundación', 'Guamal', 'Nueva Granada',
      'Pedraza', 'Pijiño del Carmen', 'Pivijay', 'Plato', 'Puebloviejo', 'Remolino',
      'Sabanas de San Ángel', 'Salamina', 'San Sebastián de Buenavista', 'San Zenón',
      'Santa Ana', 'Santa Bárbara de Pinto', 'Santa Marta', 'Sitionuevo', 'Tenerife',
      'Zapayán', 'Zona Bananera'
    ]
  },
  {
    departamento: 'Meta',
    municipios: [
      'Acacías', 'Barranca de Upía', 'Cabuyaro', 'Castilla la Nueva', 'Cubarral', 'Cumaral',
      'El Calvario', 'El Castillo', 'El Dorado', 'Fuente de Oro', 'Granada', 'Guamal',
      'La Macarena', 'Lejanías', 'Mapiripán', 'Mesetas', 'Puerto Concordia', 'Puerto Gaitán',
      'Puerto Lleras', 'Puerto López', 'Puerto Rico', 'Restrepo', 'San Carlos de Guaroa',
      'San Juan de Arama', 'San Juanito', 'San Martín', 'Uribe', 'Villavicencio', 'Vista Hermosa'
    ]
  },
  {
    departamento: 'Nariño',
    municipios: [
      'Albán', 'Aldana', 'Ancuya', 'Arboleda', 'Barbacoas', 'Belén', 'Buesaco', 'Chachagüí',
      'Colón', 'Consacá', 'Contadero', 'Córdoba', 'Cuaspud', 'Cumbal', 'Cumbitara', 'El Charco',
      'El Peñol', 'El Rosario', 'El Tablón de Gómez', 'El Tambo', 'Francisco Pizarro', 'Funes',
      'Guachucal', 'Guaitarilla', 'Gualmatán', 'Iles', 'Imués', 'Ipiales', 'La Cruz', 'La Florida',
      'La Llanada', 'La Tola', 'La Unión', 'Leiva', 'Linares', 'Los Andes', 'Magüí Payán',
      'Mallama', 'Mosquera', 'Nariño', 'Olaya Herrera', 'Ospina', 'Pasto', 'Policarpa', 'Potosí',
      'Providencia', 'Puerres', 'Pupiales', 'Ricaurte', 'Roberto Payán', 'Samaniego', 'San Bernardo',
      'San Lorenzo', 'San Pablo', 'San Pedro de Cartago', 'Sandoná', 'Santa Bárbara', 'Santacruz',
      'Sapuyes', 'Taminango', 'Tangua', 'Tumaco', 'Túquerres', 'Yacuanquer'
    ]
  },
  {
    departamento: 'Norte de Santander',
    municipios: [
      'Ábrego', 'Arboledas', 'Bochalema', 'Bucarasica', 'Cáchira', 'Cácota', 'Chinácota',
      'Chitagá', 'Convención', 'Cúcuta', 'Cucutilla', 'Durania', 'El Carmen', 'El Tarra',
      'El Zulia', 'Gramalote', 'Hacarí', 'Herrán', 'La Esperanza', 'La Playa de Belén',
      'Labateca', 'Los Patios', 'Lourdes', 'Mutiscua', 'Ocaña', 'Pamplona', 'Pamplonita',
      'Puerto Santander', 'Ragonvalia', 'Salazar de Las Palmas', 'San Calixto', 'San Cayetano',
      'Santiago', 'Sardinata', 'Silos', 'Teorama', 'Tibú', 'Toledo', 'Villa Caro', 'Villa del Rosario'
    ]
  },
  {
    departamento: 'Putumayo',
    municipios: [
      'Colón', 'Mocoa', 'Orito', 'Puerto Asís', 'Puerto Caicedo', 'Puerto Guzmán',
      'Puerto Leguízamo', 'San Francisco', 'San Miguel', 'Santiago', 'Sibundoy',
      'Valle del Guamuez', 'Villagarzón'
    ]
  },
  {
    departamento: 'Quindío',
    municipios: [
      'Armenia', 'Buenavista', 'Calarcá', 'Circasia', 'Córdoba', 'Filandia', 'Génova',
      'La Tebaida', 'Montenegro', 'Pijao', 'Quimbaya', 'Salento'
    ]
  },
  {
    departamento: 'Risaralda',
    municipios: [
      'Apía', 'Balboa', 'Belén de Umbría', 'Dosquebradas', 'Guática', 'La Celia', 'La Virginia',
      'Marsella', 'Mistrató', 'Pereira', 'Pueblo Rico', 'Quinchía', 'Santa Rosa de Cabal', 'Santuario'
    ]
  },
  {
    departamento: 'Santander',
    municipios: [
      'Aguada', 'Albania', 'Aratoca', 'Barbosa', 'Barichara', 'Barrancabermeja', 'Betulia',
      'Bolívar', 'Bucaramanga', 'Cabrera', 'California', 'Capitanejo', 'Carcasí', 'Cepitá',
      'Cerrito', 'Charalá', 'Charta', 'Chima', 'Chipatá', 'Cimitarra', 'Concepción', 'Confines',
      'Contratación', 'Coromoro', 'Curití', 'El Carmen de Chucurí', 'El Guacamayo', 'El Peñón',
      'El Playón', 'Encino', 'Enciso', 'Florián', 'Floridablanca', 'Galán', 'Gámbita', 'Girón',
      'Guaca', 'Guadalupe', 'Guapotá', 'Guavatá', 'Güepsa', 'Hato', 'Jesús María', 'Jordán',
      'La Belleza', 'La Paz', 'Landázuri', 'Lebrija', 'Los Santos', 'Macaravita', 'Málaga',
      'Matanza', 'Mogotes', 'Molagavita', 'Ocamonte', 'Oiba', 'Onzaga', 'Palmar',
      'Palmas del Socorro', 'Páramo', 'Piedecuesta', 'Pinchote', 'Puente Nacional', 'Puerto Parra',
      'Puerto Wilches', 'Rionegro', 'Sabana de Torres', 'San Andrés', 'San Benito', 'San Gil',
      'San Joaquín', 'San José de Miranda', 'San Miguel', 'San Vicente de Chucurí', 'Santa Bárbara',
      'Santa Helena del Opón', 'Simacota', 'Socorro', 'Suaita', 'Sucre', 'Suratá', 'Tona',
      'Valle de San José', 'Vélez', 'Vetas', 'Villanueva', 'Zapatoca'
    ]
  },
  {
    departamento: 'Sucre',
    municipios: [
      'Buenavista', 'Caimito', 'Chalán', 'Colosó', 'Corozal', 'Coveñas', 'El Roble', 'Galeras',
      'Guaranda', 'La Unión', 'Los Palmitos', 'Majagual', 'Morroa', 'Ovejas', 'Palmito',
      'Sampués', 'San Benito Abad', 'San Juan de Betulia', 'San Marcos', 'San Onofre',
      'San Pedro', 'Sincé', 'Sincelejo', 'Sucre', 'Tolú', 'Toluviejo'
    ]
  },
  {
    departamento: 'Tolima',
    municipios: [
      'Alpujarra', 'Alvarado', 'Ambalema', 'Anzoátegui', 'Armero Guayabal', 'Ataco', 'Cajamarca',
      'Carmen de Apicalá', 'Casabianca', 'Chaparral', 'Coello', 'Coyaima', 'Cunday', 'Dolores',
      'Espinal', 'Falan', 'Flandes', 'Fresno', 'Guamo', 'Herveo', 'Honda', 'Ibagué', 'Icononzo',
      'Lérida', 'Líbano', 'Mariquita', 'Melgar', 'Murillo', 'Natagaima', 'Ortega', 'Palocabildo',
      'Piedras', 'Planadas', 'Prado', 'Purificación', 'Rioblanco', 'Roncesvalles', 'Rovira',
      'Saldaña', 'San Antonio', 'San Luis', 'Santa Isabel', 'Suárez', 'Valle de San Juan',
      'Venadillo', 'Villahermosa', 'Villarrica'
    ]
  },
  {
    departamento: 'Valle del Cauca',
    municipios: [
      'Alcalá', 'Andalucía', 'Ansermanuevo', 'Argelia', 'Bolívar', 'Buenaventura', 'Buga',
      'Bugalagrande', 'Caicedonia', 'Cali', 'Calima El Darién', 'Candelaria', 'Cartago', 'Dagua',
      'El Águila', 'El Cairo', 'El Cerrito', 'El Dovio', 'Florida', 'Ginebra', 'Guacarí',
      'Jamundí', 'La Cumbre', 'La Unión', 'La Victoria', 'Obando', 'Palmira', 'Pradera',
      'Restrepo', 'Riofrío', 'Roldanillo', 'San Pedro', 'Sevilla', 'Toro', 'Trujillo', 'Tuluá',
      'Ulloa', 'Versalles', 'Vijes', 'Yotoco', 'Yumbo', 'Zarzal'
    ]
  },
  {
    departamento: 'Vaupés',
    municipios: [
      'Carurú', 'Mitú', 'Pacoa', 'Papunaua', 'Taraira', 'Yavaraté'
    ]
  },
  {
    departamento: 'Vichada',
    municipios: [
      'Cumaribo', 'La Primavera', 'Puerto Carreño', 'Santa Rosalía'
    ]
  }
];
