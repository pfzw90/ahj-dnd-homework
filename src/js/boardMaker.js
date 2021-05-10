export default class BoardMaker {
  constructor() {
    this.notes = JSON.parse(window.localStorage.getItem('notes')) || { todo: [], 'in-progress': [], done: [] };
    this.ghostEl = null;
    this.draggedEl = null;
    this.closest = null;
  }

  drawTask(task, position, element) {
    const tsk = document.createElement('li');
    tsk.className = 'tsk';
    tsk.innerHTML = '';
    tsk.innerText = task;
    element.insertAdjacentElement(position, tsk);

    tsk.addEventListener('mouseenter', (ev) => {
      ev.preventDefault();
      if (this.draggedEl) return;
      const cancel = document.createElement('button');
      cancel.innerText = '×';
      cancel.id = 'task-remove';

      cancel.addEventListener('click', (removeEv) => {
        removeEv.preventDefault();
        const tasklist = this.notes[tsk.parentElement.id];
        tasklist.splice(tasklist.indexOf(task), 1);
        this.notes[tsk.parentElement.id] = tasklist;
        this.refreshStorage();
        tsk.remove();
      });

      tsk.insertAdjacentElement('beforeend', cancel);
    });

    tsk.addEventListener('mouseleave', () => {
      const rem = tsk.querySelector('#task-remove');
      if (rem) tsk.removeChild(rem);
    });
  }

  drawAddButton(column) {
    const addTaskBtn = document.createElement('button');
    addTaskBtn.classList.add('add-task');
    addTaskBtn.id = `${column}-btn`;
    addTaskBtn.innerHTML = '+ ADD ANOTHER TASK';

    addTaskBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const form = document.createElement('form');
      form.id = 'new-task-form';

      const input = document.createElement('textarea');
      input.placeholder = 'Type something...';

      const submit = document.createElement('button');
      submit.innerText = 'ADD TASK';

      const cancel = document.createElement('button');
      cancel.innerText = '×';
      cancel.addEventListener('click', () => {
        form.remove();
        column.insertAdjacentElement('beforeend', addTaskBtn);
      });

      form.insertAdjacentElement('afterbegin', input);
      form.insertAdjacentElement('beforeend', submit);
      form.insertAdjacentElement('beforeend', cancel);

      form.addEventListener('submit', (subEv) => {
        subEv.preventDefault();

        form.remove();
        this.notes[column.id].push(input.value);
        this.refreshStorage();

        this.drawTask(input.value, 'beforeend', column);
        this.drawAddButton(column);
      });

      column.insertAdjacentElement('beforeend', form);
      addTaskBtn.remove();
    });

    column.insertAdjacentElement('beforeend', addTaskBtn);
  }

  refreshStorage() {
    window.localStorage.setItem('notes', JSON.stringify(this.notes));
  }

  draw() {
    const container = document.createElement('div');
    container.id = 'container';

    ['todo', 'in-progress', 'done'].forEach((column) => {
      const col = document.createElement('ul');
      col.className = 'col';
      col.id = column;

      const colTitle = document.createElement('li');
      colTitle.classList.add('title');
      colTitle.innerText = column;

      col.insertAdjacentElement('afterbegin', colTitle);

      if (this.notes && this.notes[column]) {
        this.notes[column].forEach((task) => {
          this.drawTask(task, 'beforeend', col);
        });
      }

      this.drawAddButton(col);
      container.insertAdjacentElement('beforeend', col);
    });

    document.body.insertAdjacentElement('afterbegin', container);

    document.body.addEventListener('mousedown', (evt) => {
      if (!evt.target.classList.contains('tsk')) { return; }
      evt.target.removeChild(document.getElementById('task-remove'));
      this.draggedEl = evt.target;
      this.ghostEl = evt.target.cloneNode(true);
      this.ghostEl.classList.add('dragged');
      document.body.style.cursor = 'grabbing';
      document.body.appendChild(this.ghostEl);
      this.ghostEl.style.width = `${this.draggedEl.offsetWidth}px`;
      this.ghostEl.style.height = `${this.draggedEl.offsetHeight}px`;
      this.ghostEl.style.left = `${evt.pageX - this.ghostEl.offsetWidth / 2}px`;
      this.ghostEl.style.top = `${evt.pageY - this.ghostEl.offsetHeight / 2}px`;
    });

    document.body.addEventListener('mousemove', (evt) => {
      evt.preventDefault();
      if (!this.draggedEl) {
        return;
      }
      this.closest = document.elementFromPoint(evt.clientX, evt.clientY);
      document.body.style.cursor = 'grabbing';
      this.ghostEl.style.left = `${evt.pageX - this.ghostEl.offsetWidth / 2}px`;
      this.ghostEl.style.top = `${evt.pageY - this.ghostEl.offsetHeight / 2}px`;

      const tskShadow = document.createElement('li');
      tskShadow.id = 'shadow';
      tskShadow.style.width = this.draggedEl.offsetWidth;
      tskShadow.style.height = this.draggedEl.offsetHeight;

      if (this.closest.classList.contains('tsk')) {
        this.middle = this.closest.getBoundingClientRect().y + this.closest.offsetHeight / 2;
        if (evt.pageY < this.middle) this.position = 'beforebegin';
        else this.position = 'afterend';
        if (document.getElementById('shadow')) document.getElementById('shadow').remove();
        if (this.closest !== this.draggedEl) {
          this.closest.insertAdjacentElement(this.position, tskShadow);
        }
      }
    });

    document.body.addEventListener('mouseleave', () => {
      if (document.getElementById('shadow')) document.getElementById('shadow').remove();
    });

    document.body.addEventListener('mouseup', (evt) => {
      if (document.getElementById('shadow')) document.getElementById('shadow').remove();
      this.closest = document.elementFromPoint(evt.clientX, evt.clientY);
      document.body.style.cursor = 'default';
      if (!this.draggedEl || !this.closest) { return; }
      const currentParent = this.draggedEl.parentElement.id;
      const currentList = this.notes[currentParent];
      currentList.splice(currentList.indexOf(this.draggedEl.innerText), 1);
      this.notes[currentParent] = currentList;

      if (this.closest.classList.contains('tsk')) {
        this.closest.insertAdjacentElement(this.position, this.draggedEl);
        const newParent = this.closest.parentElement.id;
        const newList = this.notes[newParent];
        const closestPosition = newList.indexOf(this.closest.innerHTML);
        if (this.position === 'beforebegin') {
          if (closestPosition > 0) newList.splice(closestPosition - 1, 0, this.draggedEl.innerText);
          else newList.splice(0, 0, this.draggedEl.innerText);
        } else {
          newList.splice(closestPosition, 0, this.draggedEl.innerText);
        }
        this.notes[newParent] = newList;
      }

      if (this.closest.classList.contains('col')) {
        this.closest.querySelector('.add-task').insertAdjacentElement('beforebegin', this.draggedEl);
        this.notes[this.closest.id].push(this.draggedEl.innerText);
      }

      this.refreshStorage();
      document.body.removeChild(this.ghostEl);
      this.ghostEl = null;
      this.draggedEl = null;
      this.closest = null;
      this.position = null;
    });
  }
}
