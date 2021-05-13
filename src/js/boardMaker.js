export default class BoardMaker {
  constructor() {
    this.notes = JSON.parse(window.localStorage.getItem('notes')) || { todo: [], 'in-progress': [], done: [] };
    this.draggedEl = null;
    this.nearest = null;
    this.shadowEl = document.createElement('div');
    this.shadowEl.id = 'shadow';
  }

  drawTask(task, position, element) {
    const tsk = document.createElement('div');
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
        if (input.value !== '') {
          this.notes[column.id].push(input.value);
          this.drawTask(input.value, 'beforeend', column);
          this.refreshStorage();
        }

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
      const col = document.createElement('div');
      col.className = 'col';
      col.id = column;

      const colTitle = document.createElement('div');
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
      this.currentParent = this.draggedEl.closest('.col');
      this.currentParentId = this.currentParent.id;
      this.currentPrevious = this.draggedEl.previousSibling;
      document.body.style.cursor = 'grabbing';
      this.elemWidth = `${this.draggedEl.offsetWidth}px`;
      this.elemHeight = `${this.draggedEl.offsetHeight}px`;
      const elemPosition = this.draggedEl.getBoundingClientRect();
      this.elemLeft = evt.clientX - elemPosition.x;
      this.elemTop = evt.clientY - elemPosition.y;

      this.shadowEl.style.height = `${this.draggedEl.offsetHeight}px`;

      this.draggedEl.classList.add('dragged');
      this.draggedEl.style.left = `${evt.clientX - this.elemLeft}px`;
      this.draggedEl.style.top = `${evt.clientY - this.elemTop}px`;
      this.draggedEl.style.width = this.elemWidth;
      this.draggedEl.style.height = this.elemHeight;

      document.body.appendChild(this.draggedEl);
    });

    document.body.addEventListener('mousemove', (evt) => {
      evt.preventDefault();
      if (!this.draggedEl) {
        return;
      }

      this.nearest = document.elementFromPoint(evt.clientX, evt.clientY);
      this.draggedEl.style.left = `${evt.clientX - this.elemLeft}px`;
      this.draggedEl.style.top = `${evt.clientY - this.elemTop}px`;

      if (this.nearest.className === 'tsk') {
        this.middle = this.nearest.getBoundingClientRect().y + this.nearest.offsetHeight / 2;
        if (evt.pageY < this.middle) {
          this.nearest.insertAdjacentElement('afterbegin', this.shadowEl);
        } else {
          this.nearest.insertAdjacentElement('beforeend', this.shadowEl);
        }
      } else if (this.nearest.className === 'col') {
        this.nearest.querySelector('.add-task').insertAdjacentElement('beforebegin', this.shadowEl);
      }
    });

    document.body.addEventListener('mouseup', (evt) => {
      evt.preventDefault();
      if (!this.draggedEl) { return; }
      document.body.removeChild(this.draggedEl);
      this.nearest = document.elementFromPoint(evt.clientX, evt.clientY);
      document.body.style.cursor = 'default';
      this.draggedEl.classList.remove('dragged');

      const currentList = this.notes[this.currentParentId];
      currentList.splice(currentList.indexOf(this.draggedEl.innerText), 1);
      this.notes[this.currentParentId] = currentList;

      const newParent = this.nearest.closest('.col').id;
      const newList = this.notes[newParent];
      const nearestPosition = newList.indexOf(this.nearest.innerText);

      if (this.nearest.className === 'tsk') {
        this.middle = this.nearest.getBoundingClientRect().y + this.nearest.offsetHeight / 2;
        if (evt.pageY < this.middle) {
          this.position = 'beforebegin';
        } else {
          this.position = 'afterend';
        }

        this.nearest.insertAdjacentElement(this.position, this.draggedEl);

        if (this.position === 'beforebegin') {
          newList.splice(nearestPosition, 0, this.draggedEl.innerText);
        } else {
          newList.splice(nearestPosition + 1, 0, this.draggedEl.innerText);
        }
        this.notes[newParent] = newList;
      } else if (this.nearest.className === 'col') {
        this.nearest.querySelector('.add-task').insertAdjacentElement('beforebegin', this.draggedEl);
        this.notes[this.nearest.id].push(this.draggedEl.innerText);
      } else {
        this.currentPrevious.insertAdjacentElement('afterend', this.draggedEl);
        this.draggedEl.style.removeProperty('top');
        this.draggedEl.style.removeProperty('left');
        this.shadowEl.remove();
        this.draggedEl = null;
        return;
      }

      this.refreshStorage();
      this.draggedEl.style.removeProperty('top');
      this.draggedEl.style.removeProperty('left');
      this.draggedEl = null;
      this.position = null;
      this.shadowEl.remove();
    });
  }
}
