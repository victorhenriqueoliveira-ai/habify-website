-- Add payment gateway configuration settings to system_settings
INSERT INTO public.system_settings (key, value, category, description) VALUES
('abacatepay_api_key', '{"key": "", "updated_at": null}', 'payment', 'AbacatePay API Key for PIX payments'),
('hubla_api_key', '{"key": "", "updated_at": null}', 'payment', 'Hubla API Key for card payments'),
('payment_mode_dev', '{"enabled": false, "updated_at": null}', 'payment', 'Toggle between dev/test and production payment environment')
ON CONFLICT (key) DO NOTHING;