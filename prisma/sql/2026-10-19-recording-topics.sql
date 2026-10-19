-- Temas de las grabaciones para los filtros públicos de /dia-mundial.
-- Aplicar ANTES de desplegar el código que los usa: Prisma lee todas las
-- columnas de Recording y fallaría si esta no existe. Idempotente.
-- Temas válidos: ver RECORDING_TOPICS en src/lib/recording-topics.ts.
ALTER TABLE "Recording" ADD COLUMN IF NOT EXISTS "topics" TEXT[] NOT NULL DEFAULT '{}';

-- Clasificación de las 65 grabaciones cargadas con scripts/insert-recordings.sql.
UPDATE "Recording" AS r SET "topics" = v.topics
FROM (VALUES
  ('rec_dm25_01', ARRAY['Profesión, formación y ética']), -- Reflexiones sobre el significado de la acción para el desarr
  ('rec_dm25_02', ARRAY['Infancia y neurodesarrollo', 'Comunidad, derechos y justicia ocupacional']), -- TO con mirada neuroafirmativa: de la clínica a la comunidad
  ('rec_dm25_03', ARRAY['Rehabilitación física y neurológica']), -- TO y su intervención en el paciente quemado
  ('rec_dm25_04', ARRAY['Rehabilitación física y neurológica', 'Tecnología e innovación']), -- TO en discapacidad severa: soluciones más allá de las manos
  ('rec_dm25_05', ARRAY['Profesión, formación y ética']), -- TO: ámbitos de intervención en México
  ('rec_dm25_06', ARRAY['Infancia y neurodesarrollo']), -- La importancia de vigilar el Neurodesarrollo
  ('rec_dm25_07', ARRAY['Salud mental y adicciones']), -- Salud mental y el consumo problemático de sustancias: el pap
  ('rec_dm25_08', ARRAY['Comunidad, derechos y justicia ocupacional']), -- Aprender desde la práctica latinoamericana: Hacia una TO más
  ('rec_dm24_01', ARRAY['Tecnología e innovación']), -- Aporte de la terapia asistida con animales en la terapia ocu
  ('rec_dm24_02', ARRAY['Profesión, formación y ética']), -- Ética y lineamientos curriculares para tomar un curso de TO 
  ('rec_dm24_03', ARRAY['Infancia y neurodesarrollo']), -- Terapia Visual aplicada a Problemas de Aprendizaje
  ('rec_dm24_04', ARRAY['Salud mental y adicciones']), -- Participación en el sueño: una perspectiva ocupacional
  ('rec_dm24_05', ARRAY['Infancia y neurodesarrollo']), -- Pequeñas grandes personas: TO en Neonatología y Primera Infa
  ('rec_dm24_06', ARRAY['Comunidad, derechos y justicia ocupacional', 'Sexualidad y diversidad funcional']), -- Transición al uso de la copa menstrual en mujeres privadas d
  ('rec_dm24_07', ARRAY['Infancia y neurodesarrollo', 'Sexualidad y diversidad funcional']), -- Identidad de género y Autismo — Consideraciones para trabaja
  ('rec_dm24_08', ARRAY['Comunidad, derechos y justicia ocupacional']), -- TO comunitaria: Una mirada desde la experiencia
  ('rec_cn23_01', ARRAY['Rehabilitación física y neurológica']), -- La Intervención del TO en el Modelo Transdisciplinario de Re
  ('rec_cn23_02', ARRAY['Profesión, formación y ética']), -- Explorando oportunidades dentro de la Práctica Privada
  ('rec_cn23_03', ARRAY['Profesión, formación y ética']), -- Mesa Redonda: Proyección Inmediata de la TO en México
  ('rec_cn23_04', ARRAY['Profesión, formación y ética']), -- Retos de estudiar TO en México, desde la perspectiva Univers
  ('rec_cn23_05', ARRAY['Profesión, formación y ética']), -- Futuro de la TO: bases curriculares
  ('rec_cn23_06', ARRAY['Profesión, formación y ética']), -- Selección y uso de instrumentos de evaluación, claves para e
  ('rec_cn23_07', ARRAY['Comunidad, derechos y justicia ocupacional', 'Profesión, formación y ética']), -- Taller: Abogacía en Terapia Ocupacional
  ('rec_cn23_08', ARRAY['Profesión, formación y ética']), -- ¿Qué ha pasado con la TO en México en el último lustro?
  ('rec_cn23_09', ARRAY['Profesión, formación y ética']), -- Rompiendo esquemas: ¿Cómo escribir un libro de consulta para
  ('rec_cn23_10', ARRAY['Profesión, formación y ética']), -- Promoviendo la terapia ocupacional basada en la evidencia
  ('rec_cn23_11', ARRAY['Profesión, formación y ética']), -- Mesa Redonda: ¿Cómo lograr mayor difusión y divulgación cien
  ('rec_cn23_12', ARRAY['Profesión, formación y ética']), -- Unidad a través de la Comunidad
  ('rec_cn23_13', ARRAY['Profesión, formación y ética']), -- TO, abriendo horizontes para la licenciatura
  ('rec_cn23_14', ARRAY['Comunidad, derechos y justicia ocupacional']), -- Terapia ocupacional desde y para las personas sordas
  ('rec_cn23_15', ARRAY['Profesión, formación y ética']), -- Taller: Liderazgo en Terapia Ocupacional
  ('rec_dm22_01', ARRAY['Salud mental y adicciones']), -- Estigmas y Mitos en el Acompañamiento de Personas con Trasto
  ('rec_dm22_02', ARRAY['Profesión, formación y ética']), -- La construcción de pruebas de TO como ejercicio de derecho y
  ('rec_dm22_03', ARRAY['Comunidad, derechos y justicia ocupacional']), -- Empoderamiento de los cuidadores
  ('rec_dm22_04', ARRAY['Tecnología e innovación']), -- Asistencia Tecnológica, Una oportunidad
  ('rec_dm22_05', ARRAY['Salud mental y adicciones']), -- "Soy más que un diagnóstico"
  ('rec_dm22_06', ARRAY['Comunidad, derechos y justicia ocupacional']), -- TO forense: derechos humanos de personas con discapacidad pr
  ('rec_dm22_07', ARRAY['Comunidad, derechos y justicia ocupacional']), -- El derecho a la alimentación desde la perspectiva de la tera
  ('rec_dm22_08', ARRAY['Comunidad, derechos y justicia ocupacional']), -- Brindar oportunidades de comunicación a las personas Sordas 
  ('rec_dm22_09', ARRAY['Comunidad, derechos y justicia ocupacional']), -- Neurodiversidad y Justicia Ocupacional
  ('rec_dm22_10', ARRAY['Salud mental y adicciones']), -- Lesión Moral
  ('rec_dm21_01', ARRAY['Profesión, formación y ética']), -- Análisis de la Actividad en TO: una mirada desde la perspect
  ('rec_dm21_02', ARRAY['Comunidad, derechos y justicia ocupacional']), -- Personas con discapacidad en situaciones de emergencia o des
  ('rec_dm21_03', ARRAY['Infancia y neurodesarrollo']), -- La importancia de la TO en padres de familia con niños con A
  ('rec_dm21_04', ARRAY['Profesión, formación y ética']), -- Navegador de pacientes y la terapia ocupacional
  ('rec_dm21_05', ARRAY['Rehabilitación física y neurológica']), -- Prevención del síndrome de caídas en Adultos Mayores
  ('rec_dm21_06', ARRAY['Rehabilitación física y neurológica', 'Sexualidad y diversidad funcional']), -- Sexualidad en pacientes con cardiopatías
  ('rec_dm21_07', ARRAY['Comunidad, derechos y justicia ocupacional']), -- Hago Parte, siendo yo
  ('rec_sa21_01', ARRAY['Infancia y neurodesarrollo']), -- TO en el Abordaje del Dolor en Neonatología
  ('rec_sa21_02', ARRAY['Profesión, formación y ética']), -- Marketing en Terapia Ocupacional
  ('rec_sa21_03', ARRAY['Rehabilitación física y neurológica', 'Tecnología e innovación']), -- Férulas 3D
  ('rec_sa21_04', ARRAY['Profesión, formación y ética']), -- 60 años de Terapia Ocupacional en México
  ('rec_sa21_05', ARRAY['Rehabilitación física y neurológica', 'Tecnología e innovación']), -- Rehand
  ('rec_sa21_06', ARRAY['Infancia y neurodesarrollo', 'Rehabilitación física y neurológica']), -- MACS: Sistema de Clasificación Manual para niños con Parális
  ('rec_sa21_07', ARRAY['Sexualidad y diversidad funcional']), -- Rehabilitación sexual y Diversidad Funcional
  ('rec_sa21_08', ARRAY['Infancia y neurodesarrollo']), -- Evaluación de la Maduración Sensorial
  ('rec_sa21_09', ARRAY['Salud mental y adicciones', 'Rehabilitación física y neurológica']), -- Resiliencia ante un Aneurisma
  ('rec_dm20_01', ARRAY['Rehabilitación física y neurológica', 'Comunidad, derechos y justicia ocupacional']), -- TO en emergencias y desastres / Intervención TO en pacientes
  ('rec_dm20_02', ARRAY['Sexualidad y diversidad funcional', 'Profesión, formación y ética']), -- Fisiología de la respuesta sexual / Perfil de Modos Ocupacio
  ('rec_dm20_03', ARRAY['Infancia y neurodesarrollo']), -- TO en alteraciones sensoriales en niños por confinamiento / 
  ('rec_dm20_04', ARRAY['Tecnología e innovación', 'Profesión, formación y ética']), -- Terapia asistida con perros / Cambios de paradigmas ante el 
  ('rec_dm20_05', ARRAY['Rehabilitación física y neurológica']), -- Intervención de TO en pacientes Covid-19 en UTI / Terapia de
  ('rec_dm20_06', ARRAY['Profesión, formación y ética']), -- Compromiso con la profesión a nivel global: Perspectiva desd
  ('rec_dm20_07', ARRAY['Profesión, formación y ética']), -- Presentación de REMETO-APTO
  ('rec_dm20_08', ARRAY['Infancia y neurodesarrollo', 'Rehabilitación física y neurológica']) -- Terapia de Movimiento Inducido por Restricción a lo largo de
) AS v(id, topics)
WHERE r.id = v.id;

-- Verificación: debe devolver 0 filas.
SELECT id, title FROM "Recording" WHERE cardinality("topics") = 0;
