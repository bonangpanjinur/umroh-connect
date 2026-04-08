
CREATE TRIGGER trg_new_order_notify
AFTER INSERT ON public.shop_orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order();
