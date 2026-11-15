// ---------- interviews: 60 questions (22 press conference, 16 before the race, 22 after it), 4 answers each ----------
// Q(id, moment, condition, question es, question en, answers): an answer is [tone, media value change, es, en].
// Tones: d = tough, m = measured, s = soft, e = evasive. Placeholders: {team} {d1} {d2} {rival} {gp} {pu} {g} (best grid slot) {p} (best finish) {pts} {out} (driver who retired).
const IV_Q = [];
const Q = (id, at, w, qe, qn, a, pri) => IV_Q.push({ id, at, w, q: [qe, qn], a, pri: pri || 0 });
// ---- the press conference, when the Grand Prix starts
Q("p01", "press", null, "¿Qué esperáis de este fin de semana en {gp}?", "What do you expect from this weekend in {gp}?", [
  ["d", 3, "Venimos a ganar. Si no lo pensara, me habría quedado en casa.", "We are here to win. If I didn't believe that, I'd have stayed at home."],
  ["m", 2, "Es un circuito que conocemos bien. Queremos sumar todo lo posible y salir con datos útiles.", "We know this track well. We want to score as much as we can and leave with useful data."],
  ["s", 1, "Vamos paso a paso. Primero los libres y luego ya veremos dónde estamos.", "One step at a time. Practice first, then we'll see where we are."],
  ["e", -1, "Pregúntame el domingo por la tarde.", "Ask me on Sunday evening."]]);
Q("p02", "press", null, "Traéis piezas nuevas. ¿Hasta qué punto confiáis en ellas?", "You've brought new parts. How much do you trust them?", [
  ["d", 2, "Mucho. Si funcionan como en el túnel, más de uno se va a llevar una sorpresa.", "A lot. If they work like they did in the tunnel, a few people are in for a surprise."],
  ["m", 2, "Los números del túnel y del simulador son buenos. La pista tiene la última palabra.", "The tunnel and simulator numbers are good. The track has the final say."],
  ["s", 1, "Es un paso más dentro de un plan largo. No esperamos milagros.", "It's one more step in a long plan. We're not expecting miracles."],
  ["e", -1, "No voy a hablar de piezas. Eso es cosa de los ingenieros.", "I won't talk about parts. That's for the engineers."]]);
Q("p03", "press", null, "¿Quién es el número uno del equipo, {d1} o {d2}?", "Who is the team's number one, {d1} or {d2}?", [
  ["d", -2, "El que vaya más rápido. Y ahora mismo eso está bastante claro.", "Whoever is faster. And right now that's fairly obvious."],
  ["m", 2, "Los dos tienen el mismo coche y las mismas oportunidades. La pista decide.", "Both have the same car and the same chances. The track decides."],
  ["s", 2, "Tenemos dos pilotos número uno. Es una suerte.", "We have two number ones. We're lucky."],
  ["e", -1, "Esa pregunta siempre llega en esta época del año…", "That question always comes up at this time of year…"]]);
Q("p04", "press", null, "Se dice que {d2} habla con otro equipo para el año que viene. ¿Es cierto?", "Word is that {d2} is talking to another team for next year. Is it true?", [
  ["d", -1, "Quien quiera irse, que se vaya. Aquí nadie es imprescindible.", "Anyone who wants to leave can leave. Nobody here is indispensable."],
  ["m", 2, "{d2} tiene contrato con nosotros. Lo que pase después lo hablaremos en privado.", "{d2} is under contract with us. Whatever comes next we'll discuss in private."],
  ["s", 1, "Estamos muy contentos con {d2} y espero que siga muchos años.", "We're very happy with {d2} and I hope he stays for many years."],
  ["e", -2, "No comento rumores. Siguiente pregunta.", "I don't comment on rumours. Next question."]]);
Q("p05", "press", null, "{rival} parece muy fuerte este año. ¿Podéis con ellos?", "{rival} look very strong this year. Can you beat them?", [
  ["d", 3, "Que disfruten mientras puedan. Les estamos alcanzando.", "Let them enjoy it while it lasts. We're catching them."],
  ["m", 2, "Han hecho un gran trabajo, pero la distancia es menor de lo que parece.", "They've done a great job, but the gap is smaller than it looks."],
  ["s", 1, "Les respetamos mucho. Nos fijamos en nosotros, no en ellos.", "We respect them a lot. We focus on ourselves, not on them."],
  ["e", -1, "No miro mucho a los demás, la verdad.", "I don't really look at the others."]]);
Q("p06", "press", null, "Algunos equipos dicen que os habéis saltado el límite de presupuesto. ¿Qué respondes?", "Some teams say you've broken the budget cap. What's your answer?", [
  ["d", 3, "Que se preocupen de sus cuentas. Las nuestras están auditadas y limpias.", "They should worry about their own books. Ours are audited and clean."],
  ["m", 2, "Cumplimos el reglamento y la FIA tiene todos nuestros datos.", "We follow the rules and the FIA has all our figures."],
  ["s", 1, "Entiendo la preocupación. Todos queremos un campeonato justo.", "I understand the concern. We all want a fair championship."],
  ["e", -2, "Eso habrá que preguntárselo a ellos.", "You'd have to ask them about that."]]);
Q("p07", "press", null, "¿Os preocupa la fiabilidad después de los últimos problemas?", "Does reliability worry you after the recent problems?", [
  ["d", -1, "Nuestros proveedores tienen que hacerlo mejor, y lo saben.", "Our suppliers have to do better, and they know it."],
  ["m", 2, "Hemos encontrado el origen y aplicado cambios. Lo vigilaremos de cerca.", "We've found the cause and made changes. We'll watch it closely."],
  ["s", 1, "Es parte de las carreras. Los chicos de la fábrica están trabajando muy duro.", "It's part of racing. The people at the factory are working very hard."],
  ["e", -1, "Prefiero hablar del rendimiento.", "I'd rather talk about performance."]]);
Q("p08", "press", null, "¿Sientes presión de la junta directiva por tu puesto?", "Do you feel pressure from the board about your job?", [
  ["d", 2, "La única presión que siento es la que me pongo yo. Y es mucha.", "The only pressure I feel is the pressure I put on myself. And it's a lot."],
  ["m", 2, "La junta tiene objetivos claros y estamos trabajando para cumplirlos.", "The board has clear targets and we're working to meet them."],
  ["s", 1, "Tengo todo el apoyo de la junta. Hablamos cada semana.", "I have the board's full support. We talk every week."],
  ["e", -2, "No voy a hablar de mí.", "I won't talk about myself."]]);
Q("p09", "press", null, "La degradación aquí es alta. ¿Cómo la vais a gestionar?", "Degradation is high here. How will you manage it?", [
  ["d", 1, "Atacando. Si cuidas demasiado las ruedas, te pasan por encima.", "By attacking. If you nurse the tyres too much, you get run over."],
  ["m", 2, "Usaremos los libres para entender las tandas largas y decidir la estrategia.", "We'll use practice to understand long runs and decide the strategy."],
  ["s", 1, "Los pilotos son muy finos con las ruedas. Confío en ellos.", "Our drivers are very gentle on the tyres. I trust them."],
  ["e", -1, "Como todos los demás, supongo.", "Like everybody else, I suppose."]]);
Q("p10", "press", null, "Un expiloto dice que el concepto de vuestro coche es un error. ¿Te molesta?", "A former driver says your car concept is a mistake. Does that bother you?", [
  ["d", 3, "Opinar desde un sofá es muy fácil. Que venga a la fábrica y lo vea.", "It's easy to judge from a sofa. He's welcome to come to the factory and see."],
  ["m", 2, "Todas las opiniones son válidas, pero tenemos datos que dicen otra cosa.", "Every opinion is valid, but we have data that say otherwise."],
  ["s", 1, "Le tengo mucho respeto. Seguro que lo dice con buena intención.", "I respect him a lot. I'm sure he means well."],
  ["e", -1, "No lo he leído.", "I haven't read it."]]);
Q("p11", "press", null, "Se habla de la llegada de un gran patrocinador. ¿Podéis confirmarlo?", "There's talk of a big new sponsor. Can you confirm it?", [
  ["d", 1, "Cuando un equipo va bien, todos quieren estar. Ya lo veréis.", "When a team is doing well, everyone wants in. You'll see."],
  ["m", 2, "Hay conversaciones, como siempre. Cuando haya algo firmado lo anunciaremos.", "There are talks, as always. When something is signed, we'll announce it."],
  ["s", 1, "Estamos muy agradecidos a los socios que ya tenemos.", "We're very grateful to the partners we already have."],
  ["e", -1, "Eso es cosa del departamento comercial.", "That's for the commercial department."]]);
Q("p12", "press", null, "¿Cuál es el objetivo real de {team} esta temporada?", "What is {team}'s real target this season?", [
  ["d", 2, "Ganar. Cualquier otra respuesta sería mentir.", "To win. Any other answer would be a lie."],
  ["m", 2, "Acabar por delante de donde terminamos el año pasado y seguir creciendo.", "To finish ahead of where we ended last year and keep growing."],
  ["s", 1, "Disfrutar del proceso y que el equipo esté orgulloso del trabajo.", "To enjoy the process and make the team proud of its work."],
  ["e", -1, "El objetivo es el siguiente Gran Premio.", "The target is the next Grand Prix."]]);
Q("p13", "press", null, "Varios ingenieros vuestros se han marchado a la competencia. ¿Es un problema?", "Several of your engineers have left for rivals. Is that a problem?", [
  ["d", -1, "Si alguien se va por dinero, mejor que se vaya pronto.", "If someone leaves for money, better they go early."],
  ["m", 2, "Siempre hay movimiento en el paddock. Hemos fichado gente muy buena también.", "There's always movement in the paddock. We've hired very good people too."],
  ["s", 1, "Les deseo suerte. Han hecho mucho por este equipo.", "I wish them luck. They did a lot for this team."],
  ["e", -1, "No tengo esa información.", "I don't have that information."]]);
Q("p14", "press", null, "¿Os parece coherente el criterio de los comisarios con los límites de pista?", "Do you think the stewards are consistent on track limits?", [
  ["d", 3, "No. Cada fin de semana es una lotería y alguien tiene que decirlo.", "No. Every weekend is a lottery and someone has to say it."],
  ["m", 2, "Hay margen de mejora. Lo hablaremos con la FIA en la reunión de equipos.", "There's room for improvement. We'll raise it with the FIA at the team meeting."],
  ["s", 1, "Tienen un trabajo muy difícil. Hacen lo que pueden.", "They have a very hard job. They do their best."],
  ["e", -1, "Prefiero no meterme en eso.", "I'd rather not get into that."]]);
Q("p15", "press", null, "¿Está listo algún piloto de vuestra academia para subir a la máxima categoría?", "Is any driver from your academy ready to step up?", [
  ["d", 1, "Hay uno que ya es más rápido que algunos de la parrilla actual.", "There's one who is already faster than some on the current grid."],
  ["m", 2, "Tenemos talento y lo estamos preparando. No hay prisa.", "We have talent and we're preparing it. There's no rush."],
  ["s", 1, "Estamos orgullosos de todos los jóvenes de la academia.", "We're proud of all the youngsters in the academy."],
  ["e", -1, "Ahora mismo tenemos dos pilotos y estamos contentos.", "Right now we have two drivers and we're happy."]]);
Q("p16", "press", null, "¿Cómo es vuestra relación con {pu}, vuestro suministrador de motores?", "How is your relationship with {pu}, your engine supplier?", [
  ["d", -1, "Les hemos pedido más potencia muchas veces. Seguimos esperando.", "We've asked them for more power many times. We're still waiting."],
  ["m", 2, "Trabajamos codo con codo. Hay cosas que mejorar por ambas partes.", "We work side by side. There are things to improve on both sides."],
  ["s", 2, "Excelente. Son parte de la familia.", "Excellent. They're part of the family."],
  ["e", -1, "Es una relación profesional.", "It's a professional relationship."]]);
Q("p17", "press", null, "{team} es uno de los equipos con más seguidores en redes. ¿A qué se debe?", "{team} is one of the most followed teams on social media. Why is that?", [
  ["d", 1, "A que corremos sin miedo. A la gente le gusta eso.", "Because we race without fear. People like that."],
  ["m", 2, "A los pilotos, a la historia del equipo y a un trabajo muy bueno de comunicación.", "To the drivers, the team's history and very good communications work."],
  ["s", 2, "A los aficionados, que son los mejores del mundo. Gracias a todos.", "To the fans, who are the best in the world. Thank you all."],
  ["e", 0, "No sigo mucho las redes, la verdad.", "I don't follow social media much, honestly."]]);
Q("p18", "press", null, "Hay previsión de lluvia. ¿Os favorecería?", "Rain is forecast. Would that help you?", [
  ["d", 2, "Ojalá llueva. Con agua manda el talento, no el presupuesto.", "I hope it rains. In the wet, talent matters more than budget."],
  ["m", 2, "Puede mezclarlo todo. Estaremos preparados para cualquier escenario.", "It could mix everything up. We'll be ready for any scenario."],
  ["s", 1, "Lo importante es que todos estén seguros en la pista.", "What matters is that everyone is safe on track."],
  ["e", -1, "Yo no controlo el tiempo.", "I don't control the weather."]]);
Q("p19", "press", null, "El calendario es cada vez más largo. ¿Está agotado tu personal?", "The calendar keeps getting longer. Is your staff exhausted?", [
  ["d", 2, "Sí, y quien diga lo contrario miente. Hay que poner un límite.", "Yes, and anyone who says otherwise is lying. There has to be a limit."],
  ["m", 2, "Hacemos rotaciones para cuidar a la gente. Es un reto para todos los equipos.", "We rotate people to look after them. It's a challenge for every team."],
  ["s", 1, "Estamos muy agradecidos de poder correr en tantos sitios.", "We're very grateful to be able to race in so many places."],
  ["e", -1, "Es lo que hay.", "It is what it is."]]);
Q("p20", "press", null, "Con las nuevas restricciones de túnel de viento, ¿llegáis a tiempo con el desarrollo?", "With the new wind tunnel restrictions, can you keep up with development?", [
  ["d", 1, "Las restricciones castigan a quien trabaja bien. Pero nos adaptaremos.", "The restrictions punish those who work well. But we'll adapt."],
  ["m", 2, "Hay que ser más eficientes. Cada hora de túnel cuenta el doble.", "We have to be more efficient. Every hour in the tunnel counts double."],
  ["s", 1, "Es lo justo para que el campeonato esté más igualado.", "It's fair to keep the championship closer."],
  ["e", -1, "No entro en detalles técnicos.", "I won't go into technical details."]]);
Q("p21", "press", null, "¿Qué opinas del nuevo reglamento técnico que llega?", "What do you think of the new technical rules that are coming?", [
  ["d", 2, "Es una oportunidad para dar un golpe en la mesa. Vamos a por ello.", "It's a chance to make a statement. We're going for it."],
  ["m", 2, "Habrá equipos que acierten y otros que no. Llevamos meses trabajando en ello.", "Some teams will get it right and others won't. We've been working on it for months."],
  ["s", 1, "Confío en que sea bueno para el espectáculo.", "I hope it's good for the show."],
  ["e", -1, "Todavía es pronto para opinar.", "It's too early to say."]]);
Q("p22", "press", null, "{d2} criticó el coche en público la semana pasada. ¿Cómo te sentó?", "{d2} criticised the car in public last week. How did you take it?", [
  ["d", -2, "Mal. Los trapos sucios se lavan en casa y ya se lo he dicho.", "Badly. Dirty laundry is washed at home, and I've told him so."],
  ["m", 2, "Lo hablamos. Su frustración es comprensible y nos ayuda a mejorar.", "We talked about it. His frustration is understandable and it helps us improve."],
  ["s", 1, "Es un piloto con mucha pasión. Me gusta que diga lo que piensa.", "He's a very passionate driver. I like that he speaks his mind."],
  ["e", -1, "No recuerdo esas declaraciones.", "I don't remember those comments."]]);
// ---- before the race, in the pit lane
Q("g01", "grid", null, "Salís desde P{g}. ¿Qué resultado sería realista hoy?", "You start from P{g}. What result is realistic today?", [
  ["d", 2, "Realista es ganar posiciones. Si nos conformamos, perdemos.", "Realistic is gaining places. If we settle, we lose."],
  ["m", 2, "Con una buena salida y una estrategia limpia podemos mejorar unas cuantas posiciones.", "With a good start and a clean strategy we can gain a few places."],
  ["s", 1, "Acabar con los dos coches y aprender ya sería positivo.", "Finishing with both cars and learning would already be positive."],
  ["e", -1, "Ya lo veremos.", "We'll see."]]);
Q("g02", "grid", "front", "Primera línea de salida. ¿Es el día de ganar?", "Front row. Is today the day to win?", [
  ["d", 3, "Hemos venido a eso. Nadie nos va a regalar nada, pero nosotros tampoco.", "That's what we came for. Nobody will give us anything, and we won't either."],
  ["m", 2, "Tenemos la posición. Ahora hay que hacer una salida limpia y gestionar.", "We have the position. Now we need a clean start and to manage it."],
  ["s", 1, "Estamos felices con la clasificación. La carrera es larga.", "We're happy with qualifying. The race is long."],
  ["e", -1, "No quiero gafarlo.", "I don't want to jinx it."]]);
Q("g03", "grid", "backq", "La clasificación no fue buena. ¿Qué falló?", "Qualifying didn't go well. What went wrong?", [
  ["d", 2, "Fallamos todos: coche, reglajes y pilotos. Hoy toca remontar.", "We all failed: car, set-up and drivers. Today we fight back."],
  ["m", 2, "No encontramos el equilibrio con el viento. Mañana tenemos un plan diferente.", "We didn't find the balance in the wind. We have a different plan today."],
  ["s", 1, "Son cosas que pasan. Los chicos lo dieron todo.", "These things happen. The guys gave everything."],
  ["e", -2, "No estoy aquí para hablar de ayer.", "I'm not here to talk about yesterday."]]);
Q("g04", "grid", null, "¿Una parada o dos?", "One stop or two?", [
  ["d", 1, "Las que haga falta para ganar a los de delante.", "As many as it takes to beat those ahead."],
  ["m", 2, "Tenemos los dos planes preparados. Decidiremos según la degradación de las primeras vueltas.", "We have both plans ready. We'll decide on the degradation in the first laps."],
  ["s", 1, "Escucharemos a los pilotos. Ellos sienten las ruedas.", "We'll listen to the drivers. They feel the tyres."],
  ["e", 0, "Eso no te lo voy a contar en directo.", "I'm not telling you that live on air."]]);
Q("g05", "grid", "wet", "El cielo amenaza lluvia. ¿Arriesgaréis con los neumáticos?", "The sky is threatening rain. Will you gamble on tyres?", [
  ["d", 3, "Si llueve, seremos los primeros en entrar. Las carreras se ganan arriesgando.", "If it rains, we'll be first to stop. Races are won by taking risks."],
  ["m", 2, "Tenemos el radar en directo. Paramos en la vuelta justa, ni antes ni después.", "We have the live radar. We'll stop on the right lap, not before, not after."],
  ["s", 1, "Lo primero es la seguridad. No haremos locuras.", "Safety first. We won't do anything crazy."],
  ["e", -1, "Depende de lo que caiga.", "Depends on what falls."]]);
Q("g06", "grid", null, "La recta hasta la primera curva es larga. ¿Os preocupa la salida?", "The run to turn one is long. Are you worried about the start?", [
  ["d", 2, "A quien debería preocupar es a los de delante.", "The ones ahead should be the ones worried."],
  ["m", 2, "Hemos practicado las salidas. Hay que salir bien y no meterse en líos en la curva 1.", "We've practised starts. Get away well and stay out of trouble at turn one."],
  ["s", 1, "Les he pedido que sean listos y no arriesguen de más.", "I've asked them to be smart and not take too many risks."],
  ["e", -1, "Es una salida como cualquier otra.", "It's a start like any other."]]);
Q("g07", "grid", null, "¿Dejaréis que {d1} y {d2} luchen entre ellos?", "Will you let {d1} and {d2} race each other?", [
  ["d", 1, "Sí, pero si se tocan, el lunes tendrán una conversación muy larga conmigo.", "Yes, but if they touch, they'll have a very long chat with me on Monday."],
  ["m", 2, "Pueden luchar con respeto. El equipo está por encima de todo.", "They can race with respect. The team comes first."],
  ["s", 2, "Son libres de correr. Confío plenamente en ellos.", "They're free to race. I trust them completely."],
  ["e", -1, "Ya veremos cómo se desarrolla la carrera.", "We'll see how the race unfolds."]]);
Q("g08", "grid", null, "¿Por qué ese neumático para la salida?", "Why that tyre for the start?", [
  ["d", 1, "Porque los demás se van a equivocar.", "Because the others are going to get it wrong."],
  ["m", 2, "Nos da flexibilidad en la ventana de parada y buen agarre en la salida.", "It gives us flexibility in the pit window and good grip at the start."],
  ["s", 1, "Es lo que pidieron los pilotos, y les hacemos caso.", "It's what the drivers asked for, and we listen to them."],
  ["e", -1, "Secreto de equipo.", "Team secret."]]);
Q("g09", "grid", null, "¿Contáis con un coche de seguridad hoy?", "Are you counting on a safety car today?", [
  ["d", 1, "Si sale, lo vamos a aprovechar mejor que nadie.", "If it comes out, we'll make better use of it than anyone."],
  ["m", 2, "Aquí no es muy habitual, pero tenemos preparado cada escenario.", "It's not common here, but we have every scenario prepared."],
  ["s", 1, "Ojalá no haga falta. Prefiero una carrera limpia.", "Hopefully it won't be needed. I prefer a clean race."],
  ["e", -1, "Quién sabe.", "Who knows."]]);
Q("g10", "grid", null, "{d2} sufrió ayer en clasificación. ¿Qué le has dicho?", "{d2} struggled in qualifying yesterday. What did you tell him?", [
  ["d", -2, "Que necesitamos más de él. Así de simple.", "That we need more from him. Simple as that."],
  ["m", 2, "Hemos analizado los datos juntos. Sabe dónde perdió el tiempo y hoy irá a por todas.", "We went through the data together. He knows where he lost time and today he'll go all in."],
  ["s", 2, "Que tiene todo nuestro apoyo. Un mal día lo tiene cualquiera.", "That he has our full support. Anyone can have a bad day."],
  ["e", -1, "Lo que hablamos se queda dentro.", "What we talk about stays inside."]]);
Q("g11", "grid", null, "¿Hoy la pelea es con {rival}?", "Is today's fight against {rival}?", [
  ["d", 3, "Vamos a por ellos desde la primera curva.", "We're going after them from the first corner."],
  ["m", 2, "Están muy cerca en ritmo. Será una pelea bonita.", "They're very close on pace. It'll be a nice fight."],
  ["s", 1, "Nuestra carrera es contra nosotros mismos.", "Our race is against ourselves."],
  ["e", -1, "La pelea es con todos.", "The fight is with everybody."]]);
Q("g12", "grid", null, "¿Está tu equipo de boxes preparado para paradas rápidas?", "Is your pit crew ready for quick stops?", [
  ["d", 2, "Son los mejores del pit lane. Hoy lo veréis.", "They're the best in the pit lane. You'll see today."],
  ["m", 2, "Han entrenado mucho esta semana. La consistencia es lo que buscamos.", "They've practised a lot this week. Consistency is what we want."],
  ["s", 1, "Están tranquilos y concentrados. Confío en ellos.", "They're calm and focused. I trust them."],
  ["e", -1, "Cada parada es un mundo.", "Every stop is different."]]);
Q("g13", "grid", null, "Adelantar en {gp} es complicado. ¿Cómo pensáis ganar posiciones?", "Overtaking at {gp} is hard. How will you gain places?", [
  ["d", 2, "En la pista, rueda con rueda. Para eso están los pilotos.", "On track, wheel to wheel. That's what drivers are for."],
  ["m", 2, "Con la estrategia: undercut, overcut y una parada perfecta en el momento justo.", "Through strategy: undercut, overcut and a perfect stop at the right moment."],
  ["s", 1, "Con paciencia. La carrera es muy larga.", "With patience. The race is very long."],
  ["e", -1, "Ya se nos ocurrirá algo.", "We'll think of something."]]);
Q("g14", "grid", null, "¿Qué les has dicho a los pilotos antes de subirse al coche?", "What did you tell the drivers before they got in the car?", [
  ["d", 2, "Que no vuelvan con excusas.", "Not to come back with excuses."],
  ["m", 2, "Que se mantengan fuera de problemas en la salida y que confíen en el plan.", "To stay out of trouble at the start and trust the plan."],
  ["s", 2, "Que disfruten. Para esto trabajamos todo el año.", "To enjoy it. This is what we work all year for."],
  ["e", -1, "Lo de siempre.", "The usual."]]);
Q("g15", "grid", null, "La junta espera puntos hoy. ¿Notas esa presión?", "The board expects points today. Do you feel that pressure?", [
  ["d", 1, "La presión es un privilegio. La quiero toda.", "Pressure is a privilege. I want all of it."],
  ["m", 2, "Todos queremos puntos. Hacemos nuestro trabajo y los resultados llegarán.", "We all want points. We do our job and the results will come."],
  ["s", 1, "La junta nos apoya pase lo que pase.", "The board supports us whatever happens."],
  ["e", -2, "Eso habrá que preguntárselo a la junta.", "You'd have to ask the board."]]);
Q("g16", "grid", null, "¿Habéis cambiado algo en el coche desde la clasificación?", "Have you changed anything on the car since qualifying?", [
  ["d", 1, "Lo justo para ser más rápidos que ayer.", "Just enough to be faster than yesterday."],
  ["m", 2, "Con el parque cerrado no se puede tocar mucho. Solo algún ajuste de alerón.", "With parc fermé we can't touch much. Just a wing adjustment."],
  ["s", 1, "Muy poco. Estamos contentos con el coche.", "Very little. We're happy with the car."],
  ["e", -1, "Nada que pueda contar.", "Nothing I can tell you."]]);
// ---- after the race, in the pit lane
Q("r01", "post", "win", "¡Victoria de {d1}! ¿Qué significa para {team}?", "{d1} wins! What does it mean for {team}?", [
  ["d", 2, "Que se acostumbren. Esto no ha hecho más que empezar.", "They'd better get used to it. This is only the beginning."],
  ["m", 3, "Es la recompensa a cientos de personas que trabajan día y noche en la fábrica.", "It's the reward for hundreds of people working day and night at the factory."],
  ["s", 3, "Estoy emocionado. Esto es para los aficionados y para las familias del equipo.", "I'm emotional. This is for the fans and for the team's families."],
  ["e", 0, "Ahora toca celebrarlo. Luego hablamos.", "Time to celebrate now. We'll talk later."]], 1);
Q("r02", "post", "podium", "Podio para {d1}. ¿Sabe a poco o es un gran resultado?", "A podium for {d1}. Not enough, or a great result?", [
  ["d", 1, "Sabe a poco. Queríamos ganar y no lo hemos conseguido.", "It's not enough. We wanted to win and we didn't."],
  ["m", 3, "Es un gran resultado. Hemos maximizado lo que tenía el coche hoy.", "It's a great result. We got the most out of the car today."],
  ["s", 2, "Un podio siempre es especial. Felicidades a todo el equipo.", "A podium is always special. Congratulations to the whole team."],
  ["e", 0, "Lo valoraremos con calma.", "We'll assess it calmly."]], 1);
Q("r03", "post", "points", "{d1} termina P{p} y sumáis {pts} puntos. ¿Satisfecho?", "{d1} finishes P{p} and you score {pts} points. Satisfied?", [
  ["d", 1, "No. Este equipo no está para conformarse con migajas.", "No. This team isn't here to settle for crumbs."],
  ["m", 2, "Son puntos importantes. Hemos hecho una carrera limpia, pero nos falta ritmo.", "They're important points. A clean race, but we lack pace."],
  ["s", 2, "Sí, sumar siempre es positivo. Gracias a todos.", "Yes, scoring is always positive. Thanks to everyone."],
  ["e", -1, "Es lo que hay.", "It is what it is."]], 1);
Q("r04", "post", "nopts", "Sin puntos hoy. ¿Qué ha pasado?", "No points today. What happened?", [
  ["d", 2, "No hemos estado a la altura. Ni el coche ni nosotros. Así de claro.", "We weren't good enough. Not the car, not us. As simple as that."],
  ["m", 2, "Nos faltó ritmo y la estrategia no salió como esperábamos. Toca analizarlo.", "We lacked pace and the strategy didn't work as planned. Time to analyse it."],
  ["s", -1, "Ha sido un buen aprendizaje. Hay cosas positivas.", "It's been a good learning day. There are positives."],
  ["e", -2, "Mejor hablamos en la próxima carrera.", "Let's talk at the next race."]], 1);
Q("r05", "post", "dnf", "{out} no ha podido terminar. ¿Qué ha fallado?", "{out} couldn't finish. What went wrong?", [
  ["d", -1, "Un fallo inaceptable. Alguien tendrá que dar explicaciones.", "An unacceptable failure. Someone will have to explain it."],
  ["m", 2, "Todavía lo estamos investigando. Lo entenderemos antes de la próxima carrera.", "We're still investigating. We'll understand it before the next race."],
  ["s", 1, "Es una pena por {out}, que estaba haciendo una gran carrera.", "It's a shame for {out}, who was having a great race."],
  ["e", -1, "No tengo todavía la información.", "I don't have the information yet."]], 1);
Q("r06", "post", "dnf2", "Doble abandono. ¿Es el peor día del año?", "A double retirement. Is this the worst day of the year?", [
  ["d", 2, "Sí, y me lo tomo como algo personal. Esto no se va a repetir.", "Yes, and I take it personally. This won't happen again."],
  ["m", 2, "Es muy duro. Vamos a revisarlo todo, de arriba abajo.", "It's very hard. We'll review everything, top to bottom."],
  ["s", -1, "Son las carreras. A veces tienes días así.", "That's racing. Sometimes you have days like this."],
  ["e", -2, "Sin comentarios.", "No comment."]], 2);
Q("r07", "post", "both", "Los dos coches en los puntos. ¿Es la clave del trabajo de equipo?", "Both cars in the points. Is that the key to teamwork?", [
  ["d", 1, "Es lo mínimo que exijo cada domingo.", "It's the minimum I demand every Sunday."],
  ["m", 2, "Es la mejor señal: el coche funciona y la operativa ha sido perfecta.", "It's the best sign: the car works and the operations were perfect."],
  ["s", 2, "Sí. Un trabajo precioso de los dos pilotos y de todo el equipo.", "Yes. Beautiful work from both drivers and the whole team."],
  ["e", 0, "Los puntos son puntos.", "Points are points."]]);
Q("r08", "post", null, "Hay quien critica vuestra estrategia de hoy. ¿Os habéis equivocado?", "Some criticise your strategy today. Did you get it wrong?", [
  ["d", 2, "Desde fuera todo es muy fácil. Nosotros tenemos datos que vosotros no.", "From outside everything is easy. We have data you don't."],
  ["m", 2, "Con lo que sabíamos en ese momento era la decisión correcta. La revisaremos.", "With what we knew at that moment it was the right call. We'll review it."],
  ["s", 1, "Puede que sí. Siempre se puede hacer mejor.", "Maybe. You can always do better."],
  ["e", -1, "Es fácil opinar después.", "It's easy to judge afterwards."]]);
Q("r09", "post", "close", "{d1} y {d2} han estado muy cerca en pista. ¿Te han puesto nervioso?", "{d1} and {d2} were very close on track. Did they make you nervous?", [
  ["d", 1, "Un poco. Si se llegan a tocar, habría rodado alguna cabeza.", "A bit. If they'd touched, heads would have rolled."],
  ["m", 2, "Han luchado limpio y con respeto, como habíamos hablado.", "They fought cleanly and with respect, as we'd agreed."],
  ["s", 2, "Ha sido bonito verlos. Es lo que quieren los aficionados.", "It was great to watch. It's what the fans want."],
  ["e", -1, "Ni lo he visto, estaba mirando tiempos.", "I didn't even see it, I was looking at lap times."]]);
Q("r10", "post", null, "¿Cómo valoras las paradas en boxes de hoy?", "How do you rate today's pit stops?", [
  ["d", 1, "Tenemos que ser más rápidos. Cada décima cuenta y hoy hemos regalado alguna.", "We have to be faster. Every tenth counts and today we gave some away."],
  ["m", 2, "Consistentes, sin errores. Es lo que necesitábamos.", "Consistent, no mistakes. That's what we needed."],
  ["s", 2, "Los mecánicos han estado increíbles. Se merecen un aplauso.", "The mechanics were incredible. They deserve applause."],
  ["e", -1, "No he visto los tiempos todavía.", "I haven't seen the times yet."]]);
Q("r11", "post", "gain", "{d1} ha remontado muchas posiciones. ¿La carrera del año?", "{d1} gained a lot of places. Drive of the year?", [
  ["d", 2, "Ha demostrado quién es. Los que dudaban, que tomen nota.", "He showed who he is. The doubters should take note."],
  ["m", 2, "Una gran carrera, con buenos adelantamientos y una estrategia que funcionó.", "A great race, with good overtakes and a strategy that worked."],
  ["s", 2, "Estoy muy orgulloso de él.", "I'm very proud of him."],
  ["e", 0, "Hay que verlo con perspectiva.", "We need to look at it in perspective."]]);
Q("r12", "post", "lost", "Habéis perdido posiciones respecto a la salida. ¿Por qué?", "You lost places compared with the start. Why?", [
  ["d", -1, "Los pilotos tienen que defender mejor. No es aceptable.", "The drivers have to defend better. It's not acceptable."],
  ["m", 2, "El ritmo de carrera no estaba al nivel de la clasificación. Lo estudiaremos.", "Race pace didn't match qualifying pace. We'll study it."],
  ["s", 1, "Los demás han hecho una gran carrera. Hay que reconocerlo.", "The others had a great race. We have to acknowledge that."],
  ["e", -1, "A veces las carreras salen así.", "Sometimes races go like that."]]);
Q("r13", "post", null, "¿Cómo os habéis visto hoy frente a {rival}?", "How did you compare with {rival} today?", [
  ["d", 2, "Hoy les hemos visto la cara. El domingo que viene, la espalda.", "Today we saw their faces. Next Sunday, their backs."],
  ["m", 2, "Muy parecidos en ritmo. Detalles como la salida y las paradas han marcado la diferencia.", "Very similar pace. Details like the start and the stops made the difference."],
  ["s", 1, "Son un gran equipo y les felicito por su carrera.", "They're a great team and I congratulate them on their race."],
  ["e", -1, "No me fijo en los demás.", "I don't look at the others."]]);
Q("r14", "post", "d2bad", "{d2} ha quedado lejos hoy. ¿Estás preocupado por su rendimiento?", "{d2} finished well back today. Are you worried about his performance?", [
  ["d", -2, "Sí. Necesitamos mucho más de él y lo sabe.", "Yes. We need a lot more from him and he knows it."],
  ["m", 2, "No ha sido su mejor día. Vamos a analizar los datos con él, sin dramas.", "It wasn't his best day. We'll go through the data with him, no drama."],
  ["s", 2, "No, nada. Tiene todo nuestro apoyo y volverá más fuerte.", "No, not at all. He has our full support and he'll come back stronger."],
  ["e", -1, "No es momento de hablar de eso.", "This isn't the time to talk about that."]]);
Q("r15", "post", "fl", "Os lleváis la vuelta rápida. ¿Era el plan?", "You took the fastest lap. Was that the plan?", [
  ["d", 2, "Para que todos vean el ritmo que tenemos de verdad.", "So everyone can see the real pace we have."],
  ["m", 2, "Teníamos margen y lo aprovechamos sin poner en riesgo el resultado.", "We had a margin and used it without putting the result at risk."],
  ["s", 1, "Un pequeño premio extra para el equipo.", "A small extra reward for the team."],
  ["e", 0, "Ha salido así.", "It just happened."]]);
Q("r16", "post", null, "¿Han funcionado las mejoras que trajisteis?", "Did the upgrades you brought work?", [
  ["d", 1, "Sí, y queda mucho más por venir. Los demás deberían preocuparse.", "Yes, and there's much more to come. The others should be worried."],
  ["m", 2, "Hacen lo que esperábamos. Ahora hay que sacarles todo el partido.", "They do what we expected. Now we need to get the most out of them."],
  ["s", 1, "Es pronto para decirlo, pero hay buenas sensaciones.", "Too early to say, but the feeling is good."],
  ["e", -1, "Lo veremos en la fábrica.", "We'll see at the factory."]]);
Q("r17", "post", null, "¿Qué esperas de la próxima carrera?", "What do you expect from the next race?", [
  ["d", 2, "Más. Mucho más. Ya estamos pensando en ella.", "More. Much more. We're already thinking about it."],
  ["m", 2, "Es un circuito que debería adaptarse mejor a nuestro coche.", "It's a track that should suit our car better."],
  ["s", 1, "Primero descansar un poco. Luego, a trabajar.", "Rest a bit first. Then back to work."],
  ["e", -1, "Una carrera cada vez.", "One race at a time."]]);
Q("r18", "post", null, "Se ha oído algo de tensión en la radio. ¿Qué pasó?", "There was some tension on the radio. What happened?", [
  ["d", -1, "El piloto conduce y el muro decide. Que no se le olvide.", "The driver drives and the pit wall decides. He shouldn't forget it."],
  ["m", 2, "Es normal en caliente. Lo hemos hablado y está todo claro.", "It's normal in the heat of the moment. We've talked and it's all clear."],
  ["s", 1, "Son pilotos, viven con mucha adrenalina. No pasa nada.", "They're drivers, they live on adrenaline. It's fine."],
  ["e", -1, "No he escuchado nada raro.", "I didn't hear anything strange."]]);
Q("r19", "post", null, "¿Cómo ha sido la gestión de los neumáticos?", "How was the tyre management?", [
  ["d", 1, "Hemos sido demasiado conservadores. Teníamos que haber apretado más.", "We were too conservative. We should have pushed harder."],
  ["m", 2, "Buena. Hemos hecho las vueltas que queríamos con cada juego.", "Good. We did the laps we wanted on each set."],
  ["s", 1, "Los pilotos las han cuidado como oro.", "The drivers looked after them like gold."],
  ["e", -1, "Las ruedas son redondas, y han rodado.", "The tyres were round, and they rolled."]]);
Q("r20", "post", null, "¿Qué mensaje mandas a los aficionados de {team}?", "What's your message to the {team} fans?", [
  ["d", 2, "Que sigan creyendo. Les vamos a devolver todo lo que nos dan.", "Keep believing. We'll pay back everything they give us."],
  ["m", 2, "Gracias por el apoyo. Seguimos trabajando para darles alegrías.", "Thanks for the support. We keep working to give them something to cheer."],
  ["s", 3, "Que son los mejores. Les he oído desde el muro todo el día.", "That they're the best. I heard them from the pit wall all day."],
  ["e", 0, "Gracias a todos.", "Thanks everyone."]]);
Q("r21", "post", null, "Con este resultado, ¿cómo queda el equipo en el campeonato?", "With this result, where does the team stand in the championship?", [
  ["d", 1, "Por debajo de donde merecemos. Y lo vamos a corregir.", "Below where we deserve. And we're going to fix that."],
  ["m", 2, "Queda mucha temporada. Todo está abierto.", "There's a lot of season left. Everything is open."],
  ["s", 1, "No miro la clasificación. Miro el trabajo de cada día.", "I don't look at the standings. I look at the daily work."],
  ["e", -1, "Echaré un vistazo luego.", "I'll have a look later."]]);
Q("r22", "post", null, "¿Han sido justos hoy los comisarios?", "Were the stewards fair today?", [
  ["d", 3, "No. Hay decisiones que no entiende nadie en el paddock.", "No. There are decisions nobody in the paddock understands."],
  ["m", 2, "Hay alguna decisión discutible. La hablaremos con ellos en privado.", "There are a few debatable calls. We'll discuss them privately."],
  ["s", 1, "Hacen un trabajo muy complicado. Lo respeto.", "They do a very difficult job. I respect it."],
  ["e", -1, "No he visto las repeticiones.", "I haven't seen the replays."]]);
const IV_TONE = { d: ["Dura", "Tough"], m: ["Moderada", "Measured"], s: ["Suave", "Soft"], e: ["Evasiva", "Evasive"] };
const IV_PRESS = [["Marta Ruiz", "Motor Total"], ["James Holt", "Grand Prix Weekly"], ["Luca Ferri", "Velocità"], ["Anke Bauer", "Rennsport Heute"], ["Sophie Martin", "Paddock Mag"],
  ["Kenji Sato", "Racing Asia"], ["Pablo Ortega", "Curva 1 Radio"], ["Emma Collins", "The Pit Lane"], ["João Lima", "Pole Position BR"]];
const IV_REPORTER = ["Daniel Ortiz", "GP TV"];
