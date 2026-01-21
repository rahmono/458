
export type Language = 'tg' | 'ru';

export const translations: Record<Language, Record<string, string>> = {
  tg: {
    // Header & General
    app_name: 'Дафтар',
    back: 'Бозгашт',
    edit: 'Таҳрир',
    delete: 'Нест кардан',
    loading: 'Боргирӣ...',
    
    // Auth/Profile
    guest_mode: 'Реҷаи меҳмон (Public)',
    my_profile: 'Профили ман',
    profile_title: 'Профили Корбар',
    switch_user: 'Иваз кардани корбар',
    settings: 'Танзимот',
    language: 'Забон',
    select_language: 'Забонро интихоб кунед',
    
    // Phone Connection
    connect_phone_title: 'Пайваст кардани рақам',
    connect_phone_desc: 'Барои истифодаи пурраи барнома, лутфан рақами телефонатонро тасдиқ кунед. Тугмаи "Кушодани Бот"-ро зер карда, "Равон кардани рақам"-ро интихоб кунед.',
    open_bot_btn: 'Кушодани Бот',
    check_again_btn: 'Санҷидан',

    // Stores
    my_stores: 'Мағозаҳои ман',
    new_store: 'Нав',
    collaborator: 'Ҳамкор',
    collaborators: 'Ҳамкорон',
    add: 'Илова',
    no_collaborators: 'Ҳамкорон нестанд',
    store_stats: 'Омори мағоза',
    view_analytics: 'Дидани графика ва ҳисоботҳо',
    
    // Verification
    verify_store: 'Мушаххаскунии мағоза',
    verification_status: 'Ҳолати тасдиқ:',
    not_verified: 'Тасдиқ нашудааст',
    verified: 'Тасдиқ шудааст',
    pending: 'Дар ҳоли санҷиш',
    rejected: 'Рад карда шуд',
    verify_btn: 'Гузаштан аз идентификатсия',
    verification_title: 'Мушаххаскунӣ',
    activity_type: 'Намуди фаъолият',
    patent: 'Патент',
    certificate: 'Шаҳодатнома',
    upload_doc: 'Расми ҳуҷҷат (Патент/Шаҳодатнома)',
    choose_photo: 'Интихоби расм',
    store_name_official: 'Номи мағоза (Барои SMS)',
    store_name_hint: 'Маслиҳат: Ҳамон номеро нависед, ки дӯкони шуморо дар маҳалла бо он мешиносанд (масалан: "Дӯкони Акаи Солеҳ").',
    sms_preview: 'Пешнамоиши паёми SMS:',
    sms_template: 'Салом, Шумо аз дукони {name} 142 сомонӣ қарздор ҳастед, агар қарзатонро сари вақт омада супоред хушҳол мешавем.',
    send_request: 'Ирсоли дархост',
    sending: 'Дар ҳоли ирсол...',
    request_sent_success: 'Дархости шумо бо муваффақият қабул шуд!',
    request_sent_desc: 'Мо маълумоти шуморо дар муддати 24 соат санҷида мебароем. Натиҷа ба шумо тариқи бот фиристода мешавад.',
    request_error: 'Хатогӣ ҳангоми ирсол. Лутфан бори дигар кӯшиш кунед.',
    request_pending_title: 'Дархост дар ҳоли баррасӣ',
    request_pending_desc: 'Шумо аллакай дархост равон кардаед. Лутфан интизор шавед, маъмурият ҳуҷҷатҳои шуморо санҷида истодааст.',
    
    // Dashboard
    total_amount: 'Маблағи умумии қарз',
    search_placeholder: 'Ҷустуҷӯ (ном ё телефон)...',
    nothing_found: 'Ҳеҷ чиз ёфт нашуд',
    list_empty: 'Рӯйхат холи аст',
    loading_store: 'Боргирии мағоза...',
    
    // Detail
    current_debt: 'Қарзи ҷорӣ',
    reminder: 'Ёдраскунӣ',
    add_transaction: 'Сабти амалиёт',
    transaction_history: 'Таърихи амалиётҳо',
    no_transactions: 'Ҳанӯз ягон амалиёт нест',
    debt: 'Қарз',
    payment: 'Пардохт',
    created_by: 'Илова кард:',
    feature_under_construction: 'Функсияи ирсоли паём ба мизоҷ дар ҳоли бозсозӣ аст ва дар наздиктарин фурсат дастрас мешавад',
    
    // Transaction Modal
    transaction_modal_title: 'Сабти амалиёт',
    i_gave_debt: 'Қарз додам',
    i_received_money: 'Пул гирифтам',
    to: 'Ба',
    from: 'Аз',
    description_label: 'Тавсиф (Ихтиёрӣ)',
    desc_placeholder_debt: 'Масалан: Нон, Шакар',
    desc_placeholder_payment: 'Масалан: Қисман пардохт',
    confirm: 'Тасдиқ кардан',
    
    // Add Debtor Modal
    add_debtor_title: 'Иловаи мизоҷи нав',
    name_placeholder: 'Ному насаб',
    phone_placeholder: 'Рақами телефон (900...)',
    add_btn: 'Илова кардан',
    blacklist_warning: 'Диққат: Ин мизоҷ дар мағозаҳои дигар қарздор аст (Симулятсия).',
    
    // Transaction Detail
    transaction_detail_title: 'Тафсилоти амалиёт',
    performed_by: 'Амалиётро иҷро кард',
    balance_change: 'Тағйирёбии баланс',
    prev_debt: 'Қарзи пешина:',
    amount: 'Миқдори амалиёт:',
    new_debt: 'Қарзи нав:',
    old_data_info: 'Ин маълумот барои амалиётҳои кӯҳна дастрас нест.',
    delete_transaction: 'Нест кардани амалиёт',
    delete_transaction_confirm: 'Оё ин сабтро нест кардан мехоҳед? Баланси мизоҷ бозҳисобӣ мешавад.',
    
    // Analytics
    analytics_title: 'Аналитика',
    time_filter: 'Филтр аз рӯи вақт',
    date_from: 'Аз санаи',
    date_to: 'То санаи',
    results: 'Натиҷаҳо',
    total_debts: 'Ҷамъи қарзҳо',
    total_payments: 'Ҷамъи пардохтҳо',
    detailed_list: 'Рӯйхати муфассал',
    debts_list: 'Қарзҳо (Киҳо гирифтанд?)',
    payments_list: 'Пардохтҳо (Киҳо супориданд?)',
    no_data_period: 'Дар ин давра маълумот нест',
    monthly_chart: 'Графикаи моҳона',
    given: 'Қарз дода шуд',
    received: 'Пардохт шуд',
    
    // Common
    save: 'Сабт кардан',
    edit_customer: 'Таҳрири мизоҷ',
    new_store_title: 'Мағозаи нав',
    store_name: 'Номи мағоза',
    create: 'Сохтан',
    add_collaborator_title: 'Иловаи ҳамкор',
    search_collab_placeholder: 'Ҷустуҷӯ (Бо рақами телефон)',
    collab_name_placeholder: 'Рақами телефон (992...)',
    searching: 'Ҷустуҷӯ...',
    not_found_bot: 'Ҳеҷ кас ёфт нашуд. Боварӣ ҳосил кунед, ки ҳамкор ботро START кардааст.',
    selected_collab: 'Ҳамкори интихобшуда',
    permissions: 'Ҳуқуқҳои дастрасӣ',
    perm_add_debt: 'Иловаи қарз',
    perm_add_payment: 'Иловаи пардохт',
    perm_delete: 'Нест кардани мизоҷ/амалиёт',
    confirm_add: 'Тасдиқ ва илова',

    // SMS Reminder
    sms_reminder_title: 'Ирсоли SMS ба мизоҷ',
    sms_verification_required_title: 'Тасдиқ лозим аст',
    sms_verification_required_desc: 'Барои истифодаи хизматрасонии SMS, мағозаи шумо бояд аз идентификатсия гузарад. Ин барои пешгирии қаллобӣ зарур аст.',
    go_to_verify: 'Гузаштан ба идентификатсия',
    send_sms_btn: 'Равон кардан',
    sms_sent_success: 'SMS бо муваффақият фиристода шуд!',
    sms_send_confirm: 'Оё мехоҳед ба ин мизоҷ SMS равон кунед? Маблағи қарз ба таври худкор дар матн навишта мешавад.'
  },
  ru: {
    // Header & General
    app_name: 'Дафтар',
    back: 'Назад',
    edit: 'Редактировать',
    delete: 'Удалить',
    loading: 'Загрузка...',
    
    // Auth/Profile
    guest_mode: 'Гостевой режим (Public)',
    my_profile: 'Мой профиль',
    profile_title: 'Профиль пользователя',
    switch_user: 'Сменить пользователя',
    settings: 'Настройки',
    language: 'Язык',
    select_language: 'Выберите язык',
    
    // Phone Connection
    connect_phone_title: 'Подключить номер',
    connect_phone_desc: 'Для использования приложения, пожалуйста, подтвердите ваш номер телефона. Нажмите "Открыть Бот" и выберите "Отправить номер".',
    open_bot_btn: 'Открыть Бот',
    check_again_btn: 'Проверить',

    // Stores
    my_stores: 'Мои магазины',
    new_store: 'Новый',
    collaborator: 'Сотрудник',
    collaborators: 'Сотрудники',
    add: 'Добавить',
    no_collaborators: 'Нет сотрудников',
    store_stats: 'Статистика магазина',
    view_analytics: 'Смотреть графики и отчеты',

    // Verification
    verify_store: 'Идентификация магазина',
    verification_status: 'Статус:',
    not_verified: 'Не подтвержден',
    verified: 'Подтвержден',
    pending: 'На проверке',
    rejected: 'Отклонено',
    verify_btn: 'Пройти идентификацию',
    verification_title: 'Идентификация',
    activity_type: 'Тип деятельности',
    patent: 'Патент',
    certificate: 'Свидетельство',
    upload_doc: 'Фото документа (Патент/Свидетельство)',
    choose_photo: 'Выбрать фото',
    store_name_official: 'Название магазина (Для SMS)',
    store_name_hint: 'Совет: Используйте название, под которым ваш магазин знают местные жители (например: "Магазин у дома").',
    sms_preview: 'Предпросмотр SMS:',
    sms_template: 'Салом, Шумо аз дукони {name} 142 сомонӣ қарздор ҳастед, агар қарзатонро сари вақт омада супоред хушҳол мешавем.',
    send_request: 'Отправить запрос',
    sending: 'Отправка...',
    request_sent_success: 'Ваш запрос успешно принят!',
    request_sent_desc: 'Мы проверим ваши данные в течение 24 часов. Результат будет отправлен через бот.',
    request_error: 'Ошибка при отправке. Попробуйте еще раз.',
    request_pending_title: 'Запрос на рассмотрении',
    request_pending_desc: 'Вы уже отправили запрос. Пожалуйста, подождите, администрация проверяет ваши документы.',
    
    // Dashboard
    total_amount: 'Общая сумма долгов',
    search_placeholder: 'Поиск (имя или телефон)...',
    nothing_found: 'Ничего не найдено',
    list_empty: 'Список пуст',
    loading_store: 'Загрузка магазина...',
    
    // Detail
    current_debt: 'Текущий долг',
    reminder: 'Напомнить',
    add_transaction: 'Добавить запись',
    transaction_history: 'История операций',
    no_transactions: 'Операций пока нет',
    debt: 'Долг',
    payment: 'Оплата',
    created_by: 'Добавил:',
    feature_under_construction: 'Функция отправки сообщений находится на реконструкции и будет доступна в ближайшее время.',
    
    // Transaction Modal
    transaction_modal_title: 'Добавить операцию',
    i_gave_debt: 'Дал в долг',
    i_received_money: 'Получил деньги',
    to: 'Кому:',
    from: 'От:',
    description_label: 'Описание (Необязательно)',
    desc_placeholder_debt: 'Например: Хлеб, Сахар',
    desc_placeholder_payment: 'Например: Частичная оплата',
    confirm: 'Подтвердить',
    
    // Add Debtor Modal
    add_debtor_title: 'Новый клиент',
    name_placeholder: 'Имя и Фамилия',
    phone_placeholder: 'Номер телефона (900...)',
    add_btn: 'Добавить',
    blacklist_warning: 'Внимание: У этого клиента есть долги в других магазинах (Симуляция).',
    
    // Transaction Detail
    transaction_detail_title: 'Детали операции',
    performed_by: 'Выполнил',
    balance_change: 'Изменение баланса',
    prev_debt: 'Предыдущий долг:',
    amount: 'Сумма:',
    new_debt: 'Новый долг:',
    old_data_info: 'Данные недоступны для старых операций.',
    delete_transaction: 'Удалить операцию',
    delete_transaction_confirm: 'Вы хотите удалить эту запись? Баланс клиента будет пересчитан.',
    
    // Analytics
    analytics_title: 'Аналитика',
    time_filter: 'Фильтр по времени',
    date_from: 'От',
    date_to: 'До',
    results: 'Результаты',
    total_debts: 'Всего долгов',
    total_payments: 'Всего оплат',
    detailed_list: 'Подробный список',
    debts_list: 'Долги (Кто взял?)',
    payments_list: 'Оплаты (Кто вернул?)',
    no_data_period: 'Нет данных за этот период',
    monthly_chart: 'Ежемесячный график',
    given: 'Выдано',
    received: 'Получено',
    
    // Common
    save: 'Сохранить',
    edit_customer: 'Редактирование клиента',
    new_store_title: 'Новый магазин',
    store_name: 'Название магазина',
    create: 'Создать',
    add_collaborator_title: 'Добавить сотрудника',
    search_collab_placeholder: 'Поиск (По номеру телефона)',
    collab_name_placeholder: 'Номер телефона (992...)',
    searching: 'Поиск...',
    not_found_bot: 'Никто не найден. Убедитесь, что сотрудник нажал START в боте.',
    selected_collab: 'Выбранный сотрудник',
    permissions: 'Права доступа',
    perm_add_debt: 'Добавлять долг',
    perm_add_payment: 'Принимать оплату',
    perm_delete: 'Удалять клиента/записи',
    confirm_add: 'Подтвердить',

    // SMS Reminder
    sms_reminder_title: 'Отправка SMS клиенту',
    sms_verification_required_title: 'Требуется идентификация',
    sms_verification_required_desc: 'Чтобы использовать SMS-уведомления, ваш магазин должен пройти идентификацию. Это необходимо для предотвращения мошенничества.',
    go_to_verify: 'Пройти идентификацию',
    send_sms_btn: 'Отправить',
    sms_sent_success: 'SMS успешно отправлено!',
    sms_send_confirm: 'Хотите отправить SMS этому клиенту? Сумма долга будет подставлена автоматически.'
  }
};