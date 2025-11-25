-- Funktionen zum Abfragen der Token-Nutzung

-- 1. Funktion zum Abrufen der Token-Nutzung eines Benutzers, gruppiert nach Modell
CREATE OR REPLACE FUNCTION get_user_model_usage(user_id UUID)
RETURNS TABLE (
  model_id UUID,
  model_name TEXT,
  total_prompt_tokens BIGINT,
  total_completion_tokens BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL(10, 6)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.model_id,
    m.name AS model_name,
    SUM(ul.prompt_tokens)::BIGINT AS total_prompt_tokens,
    SUM(ul.completion_tokens)::BIGINT AS total_completion_tokens,
    SUM(ul.total_tokens)::BIGINT AS total_tokens,
    SUM(ul.estimated_cost)::DECIMAL(10, 6) AS total_cost
  FROM 
    usage_logs ul
  JOIN
    models m ON ul.model_id = m.id
  WHERE 
    ul.user_id = get_user_model_usage.user_id
  GROUP BY 
    ul.model_id, m.name
  ORDER BY 
    total_cost DESC;
END;
$$;

-- 2. Funktion zum Abrufen der Token-Nutzung eines Benutzers nach Zeitraum
CREATE OR REPLACE FUNCTION get_user_usage_by_period(user_id UUID, period TEXT)
RETURNS TABLE (
  time_period TEXT,
  total_tokens BIGINT,
  total_cost DECIMAL(10, 6)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF period = 'day' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(ul.created_at, 'YYYY-MM-DD') AS time_period,
      SUM(ul.total_tokens)::BIGINT AS total_tokens,
      SUM(ul.estimated_cost)::DECIMAL(10, 6) AS total_cost
    FROM 
      usage_logs ul
    WHERE 
      ul.user_id = get_user_usage_by_period.user_id
    GROUP BY 
      time_period
    ORDER BY 
      time_period DESC;
  ELSIF period = 'month' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(ul.created_at, 'YYYY-MM') AS time_period,
      SUM(ul.total_tokens)::BIGINT AS total_tokens,
      SUM(ul.estimated_cost)::DECIMAL(10, 6) AS total_cost
    FROM 
      usage_logs ul
    WHERE 
      ul.user_id = get_user_usage_by_period.user_id
    GROUP BY 
      time_period
    ORDER BY 
      time_period DESC;
  ELSIF period = 'year' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(ul.created_at, 'YYYY') AS time_period,
      SUM(ul.total_tokens)::BIGINT AS total_tokens,
      SUM(ul.estimated_cost)::DECIMAL(10, 6) AS total_cost
    FROM 
      usage_logs ul
    WHERE 
      ul.user_id = get_user_usage_by_period.user_id
    GROUP BY 
      time_period
    ORDER BY 
      time_period DESC;
  ELSE
    -- Fallback auf tägliche Ansicht
    RETURN QUERY
    SELECT 
      TO_CHAR(ul.created_at, 'YYYY-MM-DD') AS time_period,
      SUM(ul.total_tokens)::BIGINT AS total_tokens,
      SUM(ul.estimated_cost)::DECIMAL(10, 6) AS total_cost
    FROM 
      usage_logs ul
    WHERE 
      ul.user_id = get_user_usage_by_period.user_id
    GROUP BY 
      time_period
    ORDER BY 
      time_period DESC;
  END IF;
END;
$$;

-- 3. Funktion zum Abrufen der Token-Nutzung einer bestimmten Konversation
CREATE OR REPLACE FUNCTION get_conversation_usage(conversation_id UUID)
RETURNS TABLE (
  message_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  prompt_tokens BIGINT,
  completion_tokens BIGINT,
  total_tokens BIGINT,
  estimated_cost DECIMAL(10, 6)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.message_id,
    ul.created_at,
    ul.prompt_tokens::BIGINT,
    ul.completion_tokens::BIGINT,
    ul.total_tokens::BIGINT,
    ul.estimated_cost::DECIMAL(10, 6)
  FROM 
    usage_logs ul
  WHERE 
    ul.conversation_id = get_conversation_usage.conversation_id
  ORDER BY 
    ul.created_at;
END;
$$;

-- Erteile Berechtigungen für die Funktionen
GRANT EXECUTE ON FUNCTION get_user_model_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_usage_by_period TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_usage TO authenticated;