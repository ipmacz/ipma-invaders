// ========== IPMA ICB4 COMPETENCES ==========

const COMPETENCE_AREAS = {
    PERSPECTIVE: 'perspective',
    PEOPLE: 'people',
    PRACTICE: 'practice',
};

const AREA_CONFIG = {
    [COMPETENCE_AREAS.PERSPECTIVE]: {
        hits: 3,
        points: 30,
        color: '#E30613',
        sizeMultiplier: 0.7,  // smallest
    },
    [COMPETENCE_AREAS.PEOPLE]: {
        hits: 1,
        points: 10,
        color: '#4CAF50',
        sizeMultiplier: 1.0,  // largest
    },
    [COMPETENCE_AREAS.PRACTICE]: {
        hits: 2,
        points: 20,
        color: '#FF9800',
        sizeMultiplier: 0.85, // medium
    },
};

const COMPETENCES = [
    // PERSPECTIVE (10)
    { id: 'strategy', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Strategy', cz: 'Strategie' },
    { id: 'governance', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Governance, structures and processes', cz: 'Governance, struktury a procesy' },
    { id: 'compliance', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Compliance, standards and regulations', cz: 'Compliance, standardy a regulace' },
    { id: 'power', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Power and interest', cz: 'Moc a zájem' },
    { id: 'culture', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Culture and values', cz: 'Kultura a hodnoty' },
    { id: 'design', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Design', cz: 'Design' },
    { id: 'requirements', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Requirements and objectives', cz: 'Požadavky a cíle' },
    { id: 'scope', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Scope', cz: 'Rozsah' },
    { id: 'time', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Time', cz: 'Čas' },
    { id: 'organisation', area: COMPETENCE_AREAS.PERSPECTIVE, en: 'Organisation and information', cz: 'Organizace a informace' },

    // PEOPLE (10)
    { id: 'quality', area: COMPETENCE_AREAS.PEOPLE, en: 'Quality', cz: 'Kvalita' },
    { id: 'finance', area: COMPETENCE_AREAS.PEOPLE, en: 'Finance', cz: 'Finance' },
    { id: 'resources', area: COMPETENCE_AREAS.PEOPLE, en: 'Resources', cz: 'Zdroje' },
    { id: 'procurement', area: COMPETENCE_AREAS.PEOPLE, en: 'Procurement', cz: 'Obstarávání' },
    { id: 'plancontrol', area: COMPETENCE_AREAS.PEOPLE, en: 'Plan and control', cz: 'Plánování a kontrola' },
    { id: 'risk', area: COMPETENCE_AREAS.PEOPLE, en: 'Risk and opportunity', cz: 'Riziko a příležitost' },
    { id: 'stakeholders', area: COMPETENCE_AREAS.PEOPLE, en: 'Stakeholders', cz: 'Stakeholdeři' },
    { id: 'change', area: COMPETENCE_AREAS.PEOPLE, en: 'Change and transformation', cz: 'Změna a transformace' },
    { id: 'selectbalance', area: COMPETENCE_AREAS.PEOPLE, en: 'Select and balance', cz: 'Výběr a vyvážení' },
    { id: 'selfreflection', area: COMPETENCE_AREAS.PEOPLE, en: 'Self-reflection and self-management', cz: 'Sebereflexe a sebeřízení' },

    // PRACTICE (9)
    { id: 'integrity', area: COMPETENCE_AREAS.PRACTICE, en: 'Personal integrity and reliability', cz: 'Osobní integrita a spolehlivost' },
    { id: 'communication', area: COMPETENCE_AREAS.PRACTICE, en: 'Personal communication', cz: 'Osobní komunikace' },
    { id: 'relations', area: COMPETENCE_AREAS.PRACTICE, en: 'Relations and engagement', cz: 'Vztahy a angažovanost' },
    { id: 'leadership', area: COMPETENCE_AREAS.PRACTICE, en: 'Leadership', cz: 'Vedení' },
    { id: 'teamwork', area: COMPETENCE_AREAS.PRACTICE, en: 'Teamwork', cz: 'Týmová práce' },
    { id: 'conflict', area: COMPETENCE_AREAS.PRACTICE, en: 'Conflict and crisis', cz: 'Konflikt a krize' },
    { id: 'resourcefulness', area: COMPETENCE_AREAS.PRACTICE, en: 'Resourcefulness', cz: 'Důvtip' },
    { id: 'negotiation', area: COMPETENCE_AREAS.PRACTICE, en: 'Negotiation', cz: 'Vyjednávání' },
    { id: 'results', area: COMPETENCE_AREAS.PRACTICE, en: 'Results orientation', cz: 'Orientace na výsledky' },
];

// Get competence display name by current language
function getCompetenceName(competence) {
    return competence[currentLang] || competence.en;
}

// ========== ROUND DEFINITIONS ==========
// Each round defines which competences appear and which are targets (must be shot)
const ROUNDS = [
    // Round 1: All 29 competences — all are targets, slow intro
    {
        competences: COMPETENCES.map(c => c.id),
        targets: COMPETENCES.map(c => c.id),
        speed: 0.4,
        spawnInterval: 3000,
    },
    // Round 2: All 29 competences — all targets, slightly faster
    {
        competences: COMPETENCES.map(c => c.id),
        targets: COMPETENCES.map(c => c.id),
        speed: 0.5,
        spawnInterval: 2800,
    },
    // Round 3: All 29 competences — all targets, faster
    {
        competences: COMPETENCES.map(c => c.id),
        targets: COMPETENCES.map(c => c.id),
        speed: 0.6,
        spawnInterval: 2500,
    },
    // Round 4: Mix People + Practice (selective targets begin)
    {
        competences: ['conflict', 'resourcefulness', 'negotiation', 'results', 'resources', 'procurement', 'stakeholders', 'relations'],
        targets: ['conflict', 'resourcefulness', 'negotiation', 'results', 'relations'],
        speed: 0.7,
        spawnInterval: 2300,
    },
    // Round 5: Introduce Perspective
    {
        competences: ['strategy', 'governance', 'compliance', 'power', 'leadership', 'teamwork', 'quality'],
        targets: ['strategy', 'governance', 'compliance'],
        speed: 0.75,
        spawnInterval: 2200,
    },
    // Round 6: All areas mixed
    {
        competences: ['culture', 'design', 'requirements', 'scope', 'integrity', 'communication', 'risk', 'change', 'finance'],
        targets: ['culture', 'design', 'requirements', 'scope', 'integrity', 'communication'],
        speed: 0.8,
        spawnInterval: 2000,
    },
    // Round 7: Harder
    {
        competences: ['time', 'organisation', 'strategy', 'governance', 'conflict', 'negotiation', 'plancontrol', 'selfreflection', 'results', 'relations'],
        targets: ['time', 'organisation', 'conflict', 'negotiation', 'plancontrol', 'results'],
        speed: 0.9,
        spawnInterval: 1800,
    },
    // Round 8: Full assault
    {
        competences: ['strategy', 'compliance', 'power', 'culture', 'design', 'requirements', 'scope', 'time', 'organisation', 'leadership', 'resourcefulness', 'quality', 'stakeholders'],
        targets: ['strategy', 'compliance', 'power', 'culture', 'design', 'requirements', 'scope', 'time', 'organisation'],
        speed: 1.0,
        spawnInterval: 1600,
    },
    // Round 9: Expert level
    {
        competences: COMPETENCES.map(c => c.id).slice(0, 20),
        targets: COMPETENCES.map(c => c.id).slice(0, 15),
        speed: 1.1,
        spawnInterval: 1400,
    },
    // Round 10: Final boss - all 29
    {
        competences: COMPETENCES.map(c => c.id),
        targets: COMPETENCES.filter(c => c.area === COMPETENCE_AREAS.PERSPECTIVE).map(c => c.id),
        speed: 1.2,
        spawnInterval: 1200,
    },
];

function getCompetenceById(id) {
    return COMPETENCES.find(c => c.id === id);
}

function getRoundConfig(roundIndex) {
    if (roundIndex < ROUNDS.length) {
        return ROUNDS[roundIndex];
    }
    // Generate endless rounds beyond defined ones
    const allIds = COMPETENCES.map(c => c.id);
    const numCompetences = Math.min(29, 10 + roundIndex * 2);
    const shuffled = [...allIds].sort(() => Math.random() - 0.5).slice(0, numCompetences);
    const numTargets = Math.min(shuffled.length, Math.floor(numCompetences * 0.6));
    const targets = shuffled.slice(0, numTargets);
    return {
        competences: shuffled,
        targets,
        speed: 1.2 + (roundIndex - ROUNDS.length) * 0.1,
        spawnInterval: Math.max(800, 1200 - (roundIndex - ROUNDS.length) * 50),
    };
}
