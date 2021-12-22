const DAYS= 7;

{
    let users = [];
    let tasks = [];
    let backlogTasks = [];
    let tasksWithExecutor = [];

    let table = document.getElementById('task_table');


    //находим понедельник текущей недели, для инициализации таблицы и массива дней недели
    function getMondayDate() {
        let nowDate = new Date();
        let currentDay = nowDate.getDay();
        let monday = new Date();
        monday.setDate((currentDay === 0) ? nowDate.getDate() - 7 : nowDate.getDate() - (currentDay - 1))
        return monday;
    }

    //дни отображаемой в таблице недели
    let currentWeekDays = Array.from(Array(DAYS), (e, i) => {
        let day = getMondayDate();
        day.setDate(day.getDate() + i);
        return day;
    });

    /*получаем дни недели, смещенной относительно текущей недели*/
    /*offsetWeeks:number - смещение относительно текущей недели*/
    function setWeekDays(offsetWeeks) {
        currentWeekDays = currentWeekDays.map((e, i) => {
            e.setDate(e.getDate() + DAYS * offsetWeeks);
            return e;
        })
    }

    //заполняем шапки столбцов датами текущей недели
    function setHeadTableText() {
        let cells = Array.from(table.rows[0].cells);
        cells.shift();
        cells.forEach((elem, id) => {
            let date = currentWeekDays[id];
            elem.innerHTML = date.getDate().toString() + '.' + (date.getMonth() + 1).toString();
        })
    }

    //таск, который перетаскиваеттся из бэклога
    let darggingTask = null;
    function onDragStart(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
    }
    function allowDrop(ev) {
        ev.preventDefault();
    }
    function onDrop(ev, rowId, cellId) {
        ev.preventDefault();

        let data = ev.dataTransfer.getData("text");
        let elem = document.getElementById(data);
        elem.className = 'table_task_div';
        let taskId = darggingTask ? darggingTask.task_id : '';
        elem.innerHTML = 'Задача ' + taskId;

        let cell = table.rows[rowId].cells[cellId]
        if (cellId > 0) {
            cell.appendChild(elem);
        }

        if (darggingTask && backlogTasks.indexOf(darggingTask) >= 0) {
            backlogTasks.splice(backlogTasks.indexOf(darggingTask), 1);
            tasksWithExecutor.push(darggingTask);

            darggingTask.executor = rowId;
            elem.setAttribute('data-title', darggingTask.subject)

            //если перетаскиваем на поле с именем пользователя, ставим таск на дату, указанную в нем
            if (cellId === 0) {
                let date = new Date(darggingTask.planStartDate);
                //если эта дата на текущей неделе, отобразим ее
                if (date >= currentWeekDays[0] && date <= currentWeekDays[currentWeekDays.length - 1]) {
                    let dayId = date.getDay() === 0 ? 6 : date.getDay() - 1;
                    let cell = table.rows[rowId].cells[dayId + 1];
                    cell.appendChild(elem);
                }//иначе, просто уберем из бэклога
                else {
                    elem.remove();
                }
            }
            else {//обновляем данные в таске (дату)
                let day = currentWeekDays[cellId - 1];
                darggingTask.planStartDate = day.getFullYear() + '-' + (day.getMonth() + 1) + '-' + day.getDate();
            }
        }

    }

    //задаем обработчики перетаскивания для ячеек таблицы
    function setupDragEventOnTable() {
        let rows = Array.from(table.rows);
        rows.forEach((r, id) => {
            if (id > 0) {
                let rowId = id;
                let cells = Array.from(r.cells);
                cells.forEach((c, id) => {
                    c.ondrop = (e) => {
                        onDrop(e, rowId, id);
                    }
                    c.ondragover = allowDrop;
                })
            }
        })
    }

    //отображаем в таблие задачи на текущей неделе
    function showCurrentWeekTasks() {

        //сначала чистим таблицу
        let rows = Array.from(table.rows);
        rows.forEach((r, id) => {
            if (id > 0) {
                let cells = Array.from(r.cells);
                cells.forEach((c, id) => {
                    if (id > 0) {
                        while (c.firstChild) {
                            c.firstChild.remove()
                        }
                    }
                })
            }
        })

        //получим задачи  таблице на текущей неделе
        let weekTasks = tasksWithExecutor.map(elem => {
            elem.date = new Date(elem.planStartDate);
            return elem;
        }).filter(elem => {
            return elem.date >= currentWeekDays[0] && elem.date <= currentWeekDays[currentWeekDays.length - 1];
        })

        console.log(weekTasks);

        //заполняем таблицу задачами на текущую неделю
        weekTasks.forEach(task => {
            let day = task.date.getDay() === 0 ? 6 : task.date.getDay() - 1;
            let cell = table.rows[task.executor].cells[day + 1];
            let div = document.createElement('div');
            div.className = "table_task_div";
            div.innerHTML = 'Задача ' + task.task_id;
            div.setAttribute('data-title', task.subject);
            cell.appendChild(div);
        })
    }

    //инициализирууем бэклог
    function initBacklog() {
        let taskDiv = document.getElementById("task_div");
        backlogTasks.forEach((task, id) => {
            let div = document.createElement('div');
            div.className = "backlog_task_div";
            div.innerHTML = 'Задача ' + task.task_id + '<br>' + task.subject;
            div.setAttribute('draggable', true);
            div.setAttribute('id', 'task' + task.task_id);
            div.ondragstart = (e) => {
                darggingTask = task;
                onDragStart(e);
            }
            taskDiv.appendChild(div);
        })
    }

    function init() {

        //задаем обработчики нажатия на кнопки, после того, как данные получены
        const leftButton = document.getElementById("left_button");
        leftButton.onclick = () => {
            setWeekDays(-1);
            setHeadTableText();
            showCurrentWeekTasks();
            //console.log(currentWeekDays);
        }
        const rightButton = document.getElementById("right_button");
        rightButton.onclick = () => {
            setWeekDays(1);
            setHeadTableText();
            showCurrentWeekTasks();
            //console.log(currentWeekDays);
        }

        //добавляем пользователей в таблицу
        users.forEach((user) => {
            let row = document.createElement("TR");
            for (let i = 0; i < DAYS + 1; ++i) {
                let td = (i === 0) ? document.createElement("TH") : document.createElement("TD");
                if (i === 0) {
                    td.innerHTML = user.firstName + ' ' + user.surname;
                }
                row.appendChild(td);
            }
            table.appendChild(row);
        });
        setupDragEventOnTable();

        backlogTasks = tasks.filter(elem => !elem.executor);
        tasksWithExecutor = tasks.filter(elem => !!elem.executor);

        showCurrentWeekTasks();
        initBacklog();
    }

    setHeadTableText();

    //проблема с cors, не используя прокси сервер получаем непрозрачные данные
    const proxyUrl = '';//'https://cors-anywhere.herokuapp.com/';
    const userUrl = 'https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users?limit=15'

    let fetch_users = fetch(proxyUrl + userUrl).then(blob => blob.json());
    fetch_users
    .then(data => {
      console.log('get users', data);
      users = data.sort((a, b) => {
          return a.id - b.id;
      });
    })
    .catch((e) => {
        console.log(e);
        //location.reload();
    })

    let taskUrl = 'https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks';
    let fetch_tasks = fetch(proxyUrl + taskUrl).then(blob => blob.json());
    fetch_tasks
    .then(data => {
      console.log('get tasks', data);
      tasks = data.map((elem, i) => {
          elem.task_id = i + 1;
          return elem;
      });
    })
    .catch((e) => {
        console.log(e);
        //location.reload();
    })

    Promise.all([fetch_users, fetch_tasks])
    .then(() => {
        init();
    })

}