import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

const SlashCommandsList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const items = props.items || [];
  const itemRefs = useRef([]);
  const containerRef = useRef(null);

  // Reset scroll position and selection whenever the item list changes
  useEffect(() => {
    setSelectedIndex(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [items]);

  // Keep the highlighted item visible
  useEffect(() => {
    const el = itemRefs.current[selectedIndex];
    if (el && containerRef.current) {
      const container = containerRef.current;
      const elTop = el.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      const viewTop = container.scrollTop;
      const viewBottom = viewTop + container.clientHeight;

      if (elTop < viewTop) {
        container.scrollTop = elTop;
      } else if (elBottom > viewBottom) {
        container.scrollTop = elBottom - container.clientHeight;
      }
    }
  }, [selectedIndex]);

  const selectItem = (index) => {
    const item = items[index];
    if (item) props.command(item);
  };

  const upHandler = () =>
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);

  const downHandler = () =>
    setSelectedIndex((selectedIndex + 1) % items.length);

  const enterHandler = () => selectItem(selectedIndex);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') { upHandler(); return true; }
      if (event.key === 'ArrowDown') { downHandler(); return true; }
      if (event.key === 'Enter') { enterHandler(); return true; }
      return false;
    },
  }));

  if (!items.length) {
    return <div className="slash-menu slash-menu--empty">No matches</div>;
  }

  return (
    <div className="slash-menu" ref={containerRef}>
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          ref={(el) => { itemRefs.current[index] = el; }}
          className="slash-menu-item"
          data-selected={index === selectedIndex ? 'true' : 'false'}
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => selectItem(index)}
        >
          <span className="slash-menu-icon">{item.icon}</span>
          <span className="slash-menu-text">
            <span className="slash-menu-title">{item.title}</span>
            {item.subtitle && (
              <span className="slash-menu-subtitle">{item.subtitle}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
});

SlashCommandsList.displayName = 'SlashCommandsList';

export default SlashCommandsList;