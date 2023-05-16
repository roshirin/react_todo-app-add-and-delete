import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { UserWarning } from './UserWarning';
import { TodoAppHeader } from './components/TodoAppHeader/TodoAppHeader';
import { TodoAppContent } from './components/TodoAppContent/TodoAppContent';
import { TodoAppFooter } from './components/TodoAppFooter/TodoAppFooter';
import { Notifications } from './components/Notifications/Notifications';
import { client } from './utils/fetchClient';
import { Todo } from './types/Todo';
import { FilterType } from './types/FilterType';
import { ErrorType } from './types/ErrorType';
import { TodoPostData } from './types/TodoPostData';

const USER_ID = 10308;

const getTodos = () => client.get<Todo[]>(`/todos?userId=${USER_ID}`);
const postTodo = (data: TodoPostData) => client.post<Todo>(`/todos?userId=${USER_ID}`, data);
const deleteTodo = (todoId: number) => client.delete(`/todos/${todoId}`);

const prepareTodos = (todoList: Todo[], filterType: FilterType) => (
  todoList.filter(todo => {
    switch (filterType) {
      case FilterType.ACTIVE:
        return !todo.completed;

      case FilterType.COMPLETED:
        return todo.completed;

      default:
        return true;
    }
  })
);

const getActiveTodosCount = (todoList: Todo[]) => (
  todoList.filter(todo => !todo.completed).length
);

export const App: React.FC = () => {
  const [todoList, setTodoList] = useState<Todo[] | null>(null);
  const [filterType, setFilterType] = useState(FilterType.ALL);
  const [errorType, setErrorType] = useState(ErrorType.NONE);

  const [todoInputValue, setTodoInputValue] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isAddDisabled, setIsAddDisabled] = useState(false);

  const getTodoList = useCallback(async () => {
    const todos = await getTodos();

    setTodoList(todos);
  }, []);

  const preparedTodos = useMemo(() => (
    prepareTodos(todoList || [], filterType)
  ), [todoList, filterType]);

  const activeTodosCount = useMemo(() => (
    getActiveTodosCount(todoList || [])
  ), [todoList]);

  const areCompletedTodos = todoList
    ? activeTodosCount < todoList.length
    : false;

  const handleFilterChange = (newFilterType: FilterType) => {
    setFilterType(newFilterType);
  };

  const handleTodoInputChange = (value: string) => {
    if (errorType !== ErrorType.NONE) {
      setErrorType(ErrorType.NONE);
    }

    setTodoInputValue(value);
  };

  const executePostTodo = () => {
    const addedTodo = {
      title: todoInputValue,
      userId: USER_ID,
      completed: false,
    };

    setTempTodo({
      id: 0,
      ...addedTodo,
    });

    postTodo(addedTodo)
      .then(response => {
        const {
          id,
          title,
          userId,
          completed,
        } = response;
        const newTodo = {
          id,
          title,
          userId,
          completed,
        };

        setTodoList(currentList => (
          currentList
            ? [...currentList, newTodo]
            : [newTodo]
        ));
      })
      .catch(() => {
        setErrorType(ErrorType.ADD);
        throw new Error('Add todo error');
      })
      .finally(() => {
        setTempTodo(null);
      });
  };

  const handleAddTodo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (todoInputValue.trim().length === 0) {
      setErrorType(ErrorType.TITLE);

      return;
    }

    setIsAddDisabled(true);
    executePostTodo();
    setIsAddDisabled(false);
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      await deleteTodo(todoId);

      const newList = todoList && todoList.filter(({ id }) => todoId !== id);

      setTodoList(newList);
    } catch (error) {
      setErrorType(ErrorType.DELETE);
    }
  };

  useEffect(() => {
    getTodoList();
  }, []);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <TodoAppHeader
          activeTodosCount={activeTodosCount}
          todoInputValue={todoInputValue}
          isAddDisabled={isAddDisabled}
          onInputChange={handleTodoInputChange}
          onSubmit={handleAddTodo}
        />

        {preparedTodos && (
          <>
            <TodoAppContent
              todoList={preparedTodos}
              tempTodo={tempTodo}
              onDeleteClick={handleDeleteTodo}
            />

            <TodoAppFooter
              filterType={filterType}
              activeTodosCount={activeTodosCount}
              areCompletedTodos={areCompletedTodos}
              onFilterChange={handleFilterChange}
            />
          </>
        )}
      </div>

      <Notifications errorType={errorType} />
    </div>
  );
};

/*
<section className="section container">
  <p className="title is-4">
    Copy all you need from the prev task:
    <br />
    <a href="https://github.com/mate-academy/react_todo-app-loading-todos#react-todo-app-load-todos">React Todo App - Load Todos</a>
  </p>

  <p className="subtitle">Styles are already copied</p>
</section>
*/
